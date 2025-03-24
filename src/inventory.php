<?php
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$dataFile = 'inventory.json';

if ($method === 'GET') {
    echo file_get_contents($dataFile);
} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $inventory = json_decode(file_get_contents($dataFile), true);
    $inventory[] = $input;
    file_put_contents($dataFile, json_encode($inventory));
    echo json_encode(['success' => true]);
}
?>
