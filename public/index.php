<?php

/**
 * WoZ Nofify
 *
 * @link      https://github.com/vanch3d/woz-notify
 * @copyright Copyright (c) 2014 Nicolas Van Labeke <nicolas.github@calques3d.org>
 * @license   https://github.com/vanch3d/woz-notify/blob/3.x/LICENSE.md (MIT License)
 */

require '../vendor/autoload.php';


class WOZApp extends \Slim\Slim
{
    private static $POOL    = "../data/pool.json";
    private static $SENSOR  = "../data/status.json";
    private static $HISTORY = "../data/history.json";

    public function getRooms()
    {
        $body = json_decode(file_get_contents("../data/rooms.json"), true);
        return $body;
    }

    public function getRoom($name)
    {
        $body = json_decode(file_get_contents("../data/rooms.json"), true);
        $body=array_filter($body,function($elt) use ($name) {
            //var_dump($elt['target']);
            return $elt['id'] === $name;
        });
        return $body;
    }

    public function getSensors()
    {
        $body = json_decode(file_get_contents("../data/sensors.json"), true);
        return $body;
    }

    public function getStatus()
    {
        $body = json_decode(file_get_contents(WOZApp::$SENSOR), true);
        return $body;
    }

    public function setStatus($data)
    {
        file_put_contents(WOZApp::$SENSOR,json_encode($data));
    }

    public function getHistory()
    {
        $body = json_decode(file_get_contents(WOZApp::$HISTORY), true);
        $body = isset($body) ? $body : array();
        return $body;
    }

    public function setHistory($data)
    {
        $body = json_decode(file_get_contents(WOZApp::$HISTORY), true);
        $body = isset($body) ? $body : array();

        $body = array_merge($data,$body);
        file_put_contents(WOZApp::$HISTORY,json_encode($body));
    }

    public function getPool($room)
    {
        // load content of message pool
        $body = json_decode(file_get_contents(WOZApp::$POOL), true);
        $body = isset($body) ? $body : array();

        // extract first item with room ID
        $val = array();
        foreach ($body as $Key => $Value)
        {
            if ($Value['target'] === $room)
            {
                $val = $Value;
                unset($body [$Key]);
                break;
            }

        }

        // update pool
        file_put_contents(WOZApp::$POOL,json_encode($body));

        // return pooled message
        $ret = array('message' => $val);
        return $ret;
    }

    public function setPool($data)
    {
        $body = json_decode(file_get_contents(WOZApp::$POOL), true);
        $body = isset($body) ? $body : array();

        $body = array_merge($data,$body);
        file_put_contents(WOZApp::$POOL,json_encode($body));
    }

    public function clearHistory()
    {
        file_put_contents(WOZApp::$POOL,json_encode(array()));
        file_put_contents(WOZApp::$SENSOR,json_encode(array()));
        file_put_contents(WOZApp::$HISTORY,json_encode(array()));
    }

}

// Prepare app
$app = new WOZApp(array(
    'templates.path' => '../templates',
));

// Create monolog logger and store logger in container as singleton 
// (Singleton resources retrieve the same log resource definition each time)
$app->container->singleton('log', function () {
    $log = new \Monolog\Logger('slim-skeleton');
    $log->pushHandler(new \Monolog\Handler\StreamHandler('../logs/app.log', \Monolog\Logger::DEBUG));
    return $log;
});

// Prepare view
$app->view(new \Slim\Views\Twig());
$app->view->parserOptions = array(
    'charset' => 'utf-8',
    //'cache' => realpath('../.cache'),
    'cache' => __DIR__ . '/../.cache/twig',
    'auto_reload' => true,
    'strict_variables' => false,
    'autoescape' => true
);
$app->view->parserExtensions = array(new \Slim\Views\TwigExtension());

// Define routes
$app->get('/', function () use ($app)
{
    $rooms = $app->getRooms();
    $app->render('home.twig', array(
        'rooms' => $rooms,
     ));

})->name('home');

// Define routes
$app->get('/tv', function () use ($app)
{
    $rooms = $app->getRooms();
    $app->render('tv.twig', array(
        'rooms' => $rooms,
    ));

})->name('tv');

$app->get('/rooms/:name', function ($name) use ($app)
{
    $room = $app->getRoom($name);
    $sensors = $app->getSensors();

    if (sizeof($room) == 1)
    {
        // Sample log message
        $app->log->info("Slim-Skeleton '/' route");
        // Render index view
        $room = array_shift($room);
        $room['path'] = $app->urlFor("room.notify",array("name" => $room['id']));

        $template = isset($room['template']) ? $room['template'] : 'room.twig';
        $app->render($template,array(
            'room' => $room,
            'sensors' => $sensors
        ));
    }
    else
        $app->redirect("/");

})->name('room');

$app->get('/rooms/:name/notify.json', function ($name) use ($app)
{
    $response = $app->response();
    $response['Content-Type'] = 'application/json;charset=UTF-8';
    $ret = $app->getPool($name);
    $body = $app->getStatus();
    $ret['sensors']=$body;
    $response->setBody(json_encode($ret));

})->name('room.notify');

$app->get('/admin', function () use ($app)
{
    $rooms = $app->getRooms();
    $sensors = $app->getSensors();
    $body = $app->getStatus();

    foreach($sensors as &$sensor)
    {
        //var_dump($sensor['id'],$body);
        $status = isset($body[$sensor['id']])?$body[$sensor['id']]['status']:"";
        //var_dump($status);
        $sensor['status'] = $status;
    }
    // Sample log message
    $app->log->info("Slim-Skeleton '/admin' route");
    // Render index view
    $app->render('admin.twig', array(
        'rooms' => $rooms,
        'sensors' => $sensors
    ));
})->name('admin');

$app->options('/sensor/', function () use ($app) {})->name('post.sensor.base');
$app->post('/sensor/:name/(:status)', function ($name,$status="") use ($app) {
    $request = $app->request();
    $input = $request->post();

    //$body = json_decode(file_get_contents(WOZApp::$SENSOR), true);
    $body = $app->getStatus();

    $body = isset($body) ? $body : array();
    $item = isset($body[$name]) ? $body[$name] : array(
        "id" => $name,
        "status"=> "",
        "log" => array()
    );
    $item['status'] = $status;
    $item['log'][] = date(DateTime::ISO8601);
    $body[$name] = $item;
    //file_put_contents(WOZApp::$SENSOR,json_encode($body));
    $app->setStatus($body);

    $response = $app->response();
    $response['Content-Type'] = 'application/json;charset=UTF-8';;
    $response->setBody(json_encode($item));
});

$app->post('/notify', function () use ($app) {

    $request = $app->request();
    $input = $request->post();

    if ($input['type']=='admin')
    {

        if ($input['action'] === 'clear')
        {
            $app->clearHistory();
            return;
        }

        $rooms = $app->getRooms();
        $data = array();
        foreach ($rooms as $room)
        {
            $data[] = array(
                "type" => "admin",
                "target" => $room['id'],
                "action" => $input['action']  ,
                "date" => date(DateTime::ISO8601)
            );
        }
        $app->setPool($data);
    }
    else if ($input['type']=='message')
    {
        $temp = isset($input['checkroom']) ? $input['checkroom'] : array();
        $data = array();
        foreach($temp as $room)
        {
            $data[] = array(
                "type" => "info",
                "target" => $room,
                "msg" => $input['textarea'],
                "format" => $input['format'],
                "date" => date(DateTime::ISO8601)
            );

        }
        $app->setPool($data);
        $app->setHistory($data);
    }
})->name('post.notify');


$app->get('/timeline', function () use ($app) {
    $rooms = $app->getRooms();
    $roomid = array();
    foreach ($rooms as $val) {
        $roomid[] = $val['id'];
    }


    // Sample log message
    $app->log->info("Slim-Skeleton '/admin' route");
    // Render index view
    $app->render('timeline.twig', array(
        'rooms' => $rooms,
        'ids' => $roomid,
    ));
})->name('timeline');


// Define routes
$app->get('/timeline.json', function () use ($app) {
    $response = $app->response();
    $response['Content-Type'] = 'application/json;charset=UTF-8';

    $file = "../data/history.json";
    $body = json_decode(file_get_contents($file), true);

    $sensors = $app->getSensors();

    //$status = json_decode(file_get_contents(WOZApp::$SENSOR), true);
    $status = $app->getStatus();

    foreach($status as $item)
    {
        $sensor = $sensors[$item['id']];
        while (!empty($item['log']))
        {

            $start = array_shift($item['log']);
            $end = array_shift($item['log']);

            $template = array(
                "type" => "range",
                "level" => $sensor['id'],
                "target" => $sensor['room'],
                "msg" => $sensor['desc'],
                "start" => $start
            );

            if (isset($end))
                $template['end'] = $end;
            else
                $template['end'] = $template['start'];

            $body[]=$template;
        }




    }


    $response->setBody(json_encode($body));
})->name('timeline.json');


// Define routes
$app->get('/marytts/process', function () use ($app) {
    $response = $app->response();

    $base = "http://localhost:59125/";
    $json = file_get_contents($base . "process?" . $_SERVER['QUERY_STRING']);
    $response['Content-Type'] = "Content-Type: audio/wav";
    $response->setBody($json);


});

$app->get('/marytts', function () use ($app) {
    $response = $app->response();

    $base = "http://localhost:59125/";
    $url=$_GET['cmd'];
    $response['Content-Type'] = 'application/json;charset=UTF-8';

    try {
        $json = file_get_contents($base . $url);
        $tt = array(
            "msg" => $json
        );
        $response->setBody(json_encode($tt));

    } catch (Exception $e) {
        $response->setBody(json_encode(array(
            "error" => "Cannot connect to the MARY TTS server. Check connection"
        )));
        $response->status(500);
    }

 });

// Run app
$app->run();
