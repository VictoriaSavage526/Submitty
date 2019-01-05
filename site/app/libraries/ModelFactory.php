<?php

namespace app\libraries;


use app\exceptions\NotImplementedException;
use app\models\gradeable\Gradeable;
use app\models\Team;
use app\models\User;

/*
 * the point of having this class is to reduce the database activity.  Since the most performance-critical
 *  part of submitty is the grading page, we need to make that fast.
 *
 * NOTE: the default ordering for all gradeable(id)s is by grade released date (non-electronic) / due date (electronic)
 */
class ModelFactory {

    // Keep a single instance of each object
    private $cache = [];

    private $core = null;

    public function __construct(Core $core) {
        $this->core = $core;
    }

    /**
     * Gets a user instance by user id
     * @param string $user_id
     * @return User|null
     */
    public function getUser(string $user_id) {
        $path = "users/$user_id";
        if (isset($this->cache[$path])) {
            return $this->cache[$path];
        }

        $user = $this->core->getCache()->getModel(User::class, $path);

        if ($user === null) {
            $user = $this->core->getQueries()->getUserById($user_id);
            if ($user === null) {
                // User id doesn't exist
                return null;
            }
            $this->core->getCache()->updateModel($path, $user);
        }
        return $this->cache[$path] = $user;
    }

    /**
     * Gets a team instance by team id
     * TODO: make a version that takes a user id and gradeable id
     * @param string $team_id
     * @return Team|null
     */
    public function getTeam(string $team_id) {
        $path = "teams/$team_id";
        if (isset($this->cache[$path])) {
            return $this->cache[$path];
        }

        $team = $this->core->getCache()->getModel(Team::class, $path);

        if ($team === null) {
            $team = $this->core->getQueries()->getTeamById($team_id);
            if ($team === null) {
                // team id doesn't exist
                return null;
            }
            $this->core->getCache()->updateModel($path, $team);
        }
        return $this->cache[$path] = $team;
    }

    /**
     * Gets all Gradeable instances
     * @return \Iterator
     */
    public function getAllGradeables() {
        throw new NotImplementedException();
    }

    /**
     * Gets all gradeable ids
     * @return string[]
     */
    public function getAllGradeableIds() {
        throw new NotImplementedException();
    }

    /**
     * Gets gradeable instances by id
     * @param string[] $gradeable_ids
     * @return \Iterator the provided gradeable ids in the order provided
     */
    public function getGradeables(array $gradeable_ids) {
        throw new NotImplementedException();
    }

    /**
     * Gets a gradeable instance by id
     * @param string $gradeable_id
     * @return Gradeable
     */
    public function getGradeable(string $gradeable_id) {
        throw new NotImplementedException();
    }
}