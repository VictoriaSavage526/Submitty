<?php

namespace app\libraries;

use Psr\Log\{AbstractLogger, LogLevel};

/**
 * Class Logger
 *
 * Static class which we can use to log various parts of the system. Primiarly, we log either errors (to *_error)
 * or access (to *_access) logs which we can use to help debug certain issues people have with the system as well
 * as use for certain effects like monitoring usage for people suspected of cheating or the like. Primarily, we
 * always write to the *_error log for most of the methods here with only one method going to the *_access log.
 *
 * @package app\libraries
 */
class Logger extends AbstractLogger {

    private $log_path = null;
    private static $instance = null;

    /**
     * Don't allow usage of this class outside a static context
     */
    private function __construct() { }
    private function __clone() { }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new Logger();
        }
        return self::$instance;
    }

    /**
     * Set the log path to be used by the logger, but only if the path is a valid one (otherwise ignore)
     * @param string $path
     */
    public function setLogPath($path) {
        if (is_dir($path)) {
            $this->log_path = $path;
        }
    }

    /**
     * Returns the path that the logger is configured to use. If the logger has not been setup yet, this
     * will return null.
     *
     * @return string
     */
    public function getLogPath() {
        return $this->log_path;
    }

    /**
     * Writes a message to a logfile (named for current date) assuming that we've defined the $log_path variable
     *
     * We log a message as well as the calling URI if available. It's saved to $log_path/yyyymmdd.txt
     * (yyyy is year, mm is month dd is day) with each log entry seperated by bunch of "=-".
     *
     * @param string        $level
     * @param string|object $message: message to log to the file
     * @param array         $context
     */
    public function log($level, $message="", array $context=[]) {
        if ($this->log_path === null) {
            return;
        }

        $filename = $this->getFilename();
        $log_message = $this->getTimestamp();
        $log_message .= " - ";
        $log_message .= strtoupper((string) $level);

        $log_message .= "\n".(string) $message."\n";
        if (isset($_SERVER['HTTP_HOST']) && isset($_SERVER['REQUEST_URI'])) {
            $log_message .= 'URL: http' . (isset($_SERVER['HTTPS']) ? 's' : '') . '://';
            $log_message .= "{$_SERVER['HTTP_HOST']}/{$_SERVER['REQUEST_URI']}\n";
        }
        $log_message .= str_repeat("=-", 30)."="."\n";

        // Appends to the file using a locking mechanism, and supressing any potential error from this
        @file_put_contents(FileUtils::joinPaths($this->log_path, 'site_errors', "{$filename}.log"), $log_message, FILE_APPEND | LOCK_EX);
    }

    /**
     * Internal method that constructs a filename for us to use based on the date so that we get a filename
     * that is YYYYMMDD which we use as a prefix to our _error and _access log files.
     *
     * @return string
     */
    private function getFilename() {
        FileUtils::createDir($this->log_path);
        $date = getdate(time());
        return $date['year']. Utils::pad($date['mon']) . Utils::pad($date['mday']);
    }

    /**
     * Internal method that gives us a timestamp that we use as the beginning of any entry into the log files. The
     * timestamp is in the form of HH:mm:SS DD/MM/YYYY.
     * @return string
     */
    private function getTimestamp() {
        $date = getdate(time());
        $log_message = Utils::pad($date['hours']).":".Utils::pad($date['minutes']).":".Utils::pad($date['seconds']);
        $log_message .= " ";
        $log_message .= Utils::pad($date['mon'])."/".Utils::pad($date['mday'])."/".$date['year'];
        return $log_message;
    }

    /**
     * This writes a one line message to the _access log file which we use to monitor what pages a user goes
     * to (through a central point in the public/index.php file). This logs things in the fashion of:
     *
     * Timestamp | User ID | IP Adress | Action | User Agent
     *
     * where action is defined broadly as the page they're accessing and any other relevant information
     * (so gradeable id for when they're submitting).
     *
     * @param string $user_id
     * @param string $token
     * @param string $action
     */
    public function logAccess(string $user_id, string $token, string $action) {
        $log_message[] = $user_id;
        $log_message[] = $token;
        $log_message[] = $_SERVER['REMOTE_ADDR'];
        $log_message[] = $action;
        //$log_message[] = $_SERVER['REQUEST_URI'];
        $this->logAccessMessage('access', $log_message);
    }

    /**
     * This logs the grading activity of any graders when they
     * 1. Open the student's page to grade
     * 2. Opening a component
     * 3. Saving a component
     * The log is in the format of
     * Timestamp | Gradeable_id | Grader ID | Student ID | Component_ID (-1 if is case 1) | Action | User Agent
     *
     * where action is defined broadly as the page they're accessing and any other relevant information
     * (so gradeable id for when they're submitting).
     *
     * @param array $params All the params in a key-value array
     */
    public function logTAGrading(array $params){
        $log_message[] = $params['course_semester'];
        $log_message[] = $params['course_name'];
        $log_message[] = $params['gradeable_id'];
        $log_message[] = $params['grader_id'];
        $log_message[] = $params['submitter_id'];
        $log_message[] = array_key_exists('component_id', $params) ? $params['component_id'] : "-1";
        $log_message[] = $params['action'];
        $this->logAccessMessage('ta_grading', $log_message);
    }

    private function logAccessMessage(string $folder, array $log_message) {
        $filename = $this->getFilename();
        array_unshift($log_message, $this->getTimestamp());
        $log_message[] = $_SERVER['HTTP_USER_AGENT'];
        $log_message = implode(" | ", $log_message)."\n";
        @file_put_contents(FileUtils::joinPaths($this->log_path, $folder, "{$filename}.log"), $log_message, FILE_APPEND | LOCK_EX);
    }
}
