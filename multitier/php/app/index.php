<?php
session_start();

// Only count page views, not favicon or other asset requests
if (strpos($_SERVER['REQUEST_URI'], '/favicon.ico') === false && 
    strpos($_SERVER['REQUEST_URI'], '/') === 0) {
    
    // Counter per dimostrare il load balancing tra app servers
    if (!isset($_SESSION['visits'])) {
        $_SESSION['visits'] = 0;
    }
    $_SESSION['visits']++;
}

// Test della connessione al database
$servername = "mysql";
$username = "root";
$password = "root";
$dbname = "app_db";

try {
    $conn = new mysqli($servername, $username, $password, $dbname);
    
    if ($conn->connect_error) {
        throw new Exception("Connessione fallita: " . $conn->connect_error);
    }
    
    echo "<h1>Architettura Multi-Tier con Docker - Load Balancing</h1>";
    echo "<p>Web Server: <strong>Nginx (Load Balanced) ✓</strong></p>";
    echo "<p>Load Balancer: <strong>HAProxy ✓</strong></p>";
    echo "<p>Application Server: <strong>PHP-FPM (x3 instances) ✓</strong></p>";
    echo "<p>Session Storage: <strong>Redis ✓</strong></p>";
    echo "<p>Database Server: <strong>MySQL ✓</strong></p>";
    
    // Eseguire una semplice query
    $sql = "SELECT 1 as test_connection";
    $result = $conn->query($sql);
    
    if ($result->num_rows > 0) {
        echo "<p style='color: green;'><strong>✓ Connessione al database stabilita con successo!</strong></p>";
    }
    
    $conn->close();
    
} catch (Exception $e) {
    echo "<p style='color: red;'><strong>✗ Errore:</strong> " . $e->getMessage() . "</p>";
}
?>

<hr>

<h2>Informazioni del Sistema</h2>
<p><strong>PHP Version:</strong> <?php echo phpversion(); ?></p>
<p><strong>Hostname (App Server):</strong> <?php echo getenv('APP_SERVER_NAME') ?: gethostname(); ?></p>
<p><strong>Data:</strong> <?php echo date('Y-m-d H:i:s'); ?></p>
<p><strong>Session ID:</strong> <?php echo session_id(); ?></p>
<p><strong>Session Visits (Redis):</strong> <?php echo $_SESSION['visits']; ?></p>

<hr>

<h2>Prova il Load Balancing</h2>
<p>Ricarica la pagina più volte. Potrai vedere:</p>
<ul>
    <li><strong>Hostname:</strong> Cambierà tra php1, php2, php3 (round-robin)</li>
    <li><strong>Session Visits:</strong> Aumenterà sempre (grazie a Redis)</li>
    <li><strong>Session ID:</strong> Rimarrà lo stesso (sessione persistente)</li>
</ul>

<form method="POST">
    <input type="submit" value="Ricarica e prosegui">
</form>
