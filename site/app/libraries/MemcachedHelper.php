<?php

namespace app\libraries;

use app\models\AbstractModel;
use Memcached;

/**
 * Class MemcachedHelper
 *
 *  A helper class with minimal integration with the AbstractModel
 */
class MemcachedHelper {

    /** @var Core */
    private $core = null;

    /** @var Memcached */
    private $memcached = null;

    public function __construct(Core $core) {
        $this->core = $core;
        $this->memcached = new Memcached();
        $this->memcached->addServer('localhost', 11211);
    }

    /**
     * Loads a nested array from memcached with a given path
     * @param string $path
     * @return array
     */
    public function getArray(string $path) {
        $str = $this->memcached->get($path);
        if (empty($str)) {
            return null;
        }
        return json_decode($str, true);
    }

    /**
     * Creates a new instance of a model class from Memcached and other provided parameters
     * Note: The constructor for $model must be in the form: (Core, $details, ...$args)
     *
     * @param string $model The class to construct
     * @param string $path The path to identify the resource
     * @param mixed ...$args the arguments to construct (before the array argument)
     * @return mixed
     */
    public function getModel(string $model, string $path, ...$args) {
        $details = $this->getArray($path);
        if ($details === null) {
            return null;
        }
        return new $model($this->core, $this->getArray($path), ...$args);
    }

    /**
     * Sets the object/array associated with a given path
     * @param string $path
     * @param array $arr
     */
    public function updateArray(string $path, array $arr) {
        $this->memcached->set($path, json_encode($arr));
    }

    /**
     * Sets the object associated with a given path
     * @param string $path
     * @param AbstractModel $model
     */
    public function updateModel(string $path, AbstractModel $model) {
        $this->updateArray($path, $model->toArray());
    }
}