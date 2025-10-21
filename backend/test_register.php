<?php

// Script de test pour l'API register
$url = 'http://127.0.0.1:8000/api/register';
$data = [
    'name' => 'Test User',
    'email' => 'test@example.com',
    'password' => 'password123'
];

$options = [
    'http' => [
        'header' => "Content-Type: application/json\r\n",
        'method' => 'POST',
        'content' => json_encode($data)
    ]
];

$context = stream_context_create($options);
$result = file_get_contents($url, false, $context);

if ($result === FALSE) {
    echo "Erreur lors de l'envoi de la requête\n";
    print_r($http_response_header);
} else {
    echo "Réponse reçue :\n";
    echo $result . "\n";

    // Vérifier le code de statut HTTP
    if (isset($http_response_header[0])) {
        echo "Code de statut : " . $http_response_header[0] . "\n";
    }
}
