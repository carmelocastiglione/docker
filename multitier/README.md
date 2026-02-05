# Guida: Architettura Multi-Tier con Load Balancing e Docker

## Introduzione

In questa guida imparerai come creare un'architettura **multi-tier scalabile e production-ready** utilizzando Docker. L'architettura include:
- **Load Balancer** (HAProxy) - distribuisce il traffico tra gli app servers
- **Web Server** (Nginx x3) - gestisce le richieste HTTP
- **Application Server** (PHP-FPM x3) - elabora il codice PHP
- **Cache & Session Store** (Redis) - memorizza sessioni e cache distribuita
- **Database Server** (MySQL) - memorizza i dati persistenti

Ogni servizio esegue in container Docker indipendenti, permettendo scalabilità orizzontale e alta disponibilità.

## Funzionalità Implementate

### 1. Load Balancing con HAProxy
- Distribuisce il traffico tra 3 server Nginx
- Health checks automatici e failover
- Algoritmo di load balancing round-robin
- Dashboard di monitoraggio in tempo reale

### 2. Scalabilità Orizzontale
- Molteplici istanze Nginx (nginx1, nginx2, nginx3)
- Molteplici istanze PHP-FPM (php1, php2, php3)
- Puoi facilmente aggiungere più istanze modificando docker-compose.yml

### 3. Sessioni Distribuite con Redis
- Le sessioni sono memorizzate in Redis, non su disco
- Accessibili da qualsiasi app server
- Il contatore di sessioni persiste anche dopo i restart
- Perfetto per app server stateless

### 4. Database e Caching
- Un singolo database MySQL (condiviso da tutti gli app server)
- Redis per la gestione delle sessioni e il caching
- Tutti i server possono connettersi alle stesse risorse

## Prova il Load Balancing

1. Apri http://localhost/
2. Osserva il campo **Hostname (App Server)** - cambierà tra php1, php2, php3
3. Aggiorna la pagina più volte
4. Noterai:
   - **Session ID:** Rimane sempre lo stesso (sessione persistente)
   - **Session Visits:** Aumenta progressivamente (salvato in Redis)
   - **Hostname:** Ruota tra i tre server (round-robin)

## Architettura

```
                    ┌─────────────────┐
                    │     HAProxy     │ (Load Balancer)
                    │    Port 80      │
                    └────────┬────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
      ┌─────▼────┐     ┌─────▼────┐     ┌─────▼────┐
      │ Nginx 1  │     │ Nginx 2  │     │ Nginx 3  │ (Web Servers)
      │ :8080    │     │ :8080    │     │ :8080    │
      └─────┬────┘     └─────┬────┘     └─────┬────┘
            │                │                │
      ┌─────▼────┐     ┌─────▼────┐     ┌─────▼────┐
      │ PHP-FPM 1│     │ PHP-FPM 2│     │ PHP-FPM 3│ (App Servers)
      └─────┬────┘     └─────┬────┘     └─────┬────┘
            │                │                │
            └────────────────┼────────────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
       ┌────▼────┐      ┌────▼────┐      ┌────▼─────┐
       │  MySQL  │      │  Redis  │      │ Volumes  │
       │Database │      │Sessions │      │  Shared  │
       └─────────┘      └─────────┘      └──────────┘
```

## Struttura del Progetto

```
multitier/
├── docker-compose.yml
├── haproxy/
│   ├── Dockerfile
│   └── haproxy.cfg
├── nginx/
│   ├── Dockerfile
│   └── nginx.conf
├── php/
│   ├── Dockerfile
│   ├── php.ini
│   └── app/
│       └── index.php
├── mysql/
│   └── init.sql
└── logs/
```

## Application Entry Point: `php/app/index.php`

La pagina principale dell'applicazione demonstra il funzionamento dell'architettura multi-tier:

### Funzionalità Principali:

1. **Gestione delle Sessioni con Redis**
   - Inizializza una sessione PHP che viene memorizzata in Redis
   - Ogni visita incrementa il contatore `visits` in Redis
   - Le sessioni persistono anche dopo il riavvio dei container

2. **Connessione al Database MySQL**
   - Test automatico della connessione al database
   - Esegue una query di prova per verificare la disponibilità
   - Mostra un messaggio di successo o errore

3. **Visualizzazione delle Informazioni del Sistema**
   - **PHP Version:** Versione di PHP in esecuzione
   - **Hostname (App Server):** Identifica quale istanza PHP-FPM sta gestendo la richiesta (php1, php2 o php3)
   - **Session ID:** ID unico della sessione memorizzato in Redis
   - **Session Visits:** Contatore di visite per questa sessione (salvato in Redis)

4. **Dimostrazione del Load Balancing**
   - Ricaricando la pagina più volte, si può osservare il cambio del `Hostname` tra le tre istanze (php1, php2, php3)
   - Questo dimostra che HAProxy distribuisce il traffico equamente tra i server

### Come Funziona:

- Gli utenti navigano a `http://localhost/`
- HAProxy riceve la richiesta e la instrada a uno dei 3 server Nginx
- Nginx passa la richiesta al PHP-FPM corrispondente
- Lo script PHP si connette a MySQL e Redis
- La pagina mostra tutte le informazioni del sistema distribuito

### Codice Sorgente:

```php
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
```

## Passaggio 1: Configurare il Load Balancer (HAProxy)

### File: `haproxy/Dockerfile`

```dockerfile
FROM haproxy:2.8

COPY haproxy.cfg /usr/local/etc/haproxy/haproxy.cfg

EXPOSE 80 443

CMD ["haproxy", "-f", "/usr/local/etc/haproxy/haproxy.cfg"]
```

### File: `haproxy/haproxy.cfg`

```
global
    log stdout local0
    log stdout local1 notice
    chroot /var/lib/haproxy
    stats socket /run/haproxy/admin.sock mode 660 level admin
    stats timeout 30s
    user haproxy
    group haproxy
    daemon

defaults
    log     global
    mode    http
    option  httplog
    option  dontlognull
    timeout connect 5000
    timeout client  50000
    timeout server  50000

# Frontend - Entry point on port 80
frontend http-in
    bind *:80
    mode http
    option forwardfor
    default_backend web-servers

# Backend - Load balance across multiple Nginx servers
backend web-servers
    balance roundrobin
    mode http
    option httpchk GET /
    option forwardfor
    cookie SERVERID insert indirect nocache
    
    server nginx1 nginx1:8080 check cookie nginx1
    server nginx2 nginx2:8080 check cookie nginx2
    server nginx3 nginx3:8080 check cookie nginx3

# Stats page - Monitoring dashboard
listen stats
    bind *:8404
    stats enable
    stats uri /stats
    stats refresh 10s
    stats admin if TRUE
```

**Cosa fa:**
- Ascolta sulla porta 80 (HTTP pubblico)
- Distribuisce il traffico tra 3 Nginx servers (round-robin)
- Verifica la salute dei server con health checks
- Fornisce una dashboard di statistiche su port 8404

## Passaggio 2: Configurare il Web Server (Nginx)

### File: `nginx/Dockerfile`

```dockerfile
FROM nginx:latest

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
```

### File: `nginx/nginx.conf`

Nginx è configurato per fare load balance tra 3 server PHP-FPM:

```
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Configuration per PHP-FPM - Load balance across multiple PHP servers
    upstream php-fpm {
        least_conn;
        server php1:9000;
        server php2:9000;
        server php3:9000;
    }

    server {
        listen 8080;
        server_name localhost;

        root /var/www/html;
        index index.php index.html;

        location / {
            try_files $uri $uri/ /index.php?$query_string;
        }

        # Gestire i file PHP
        location ~ \.php$ {
            fastcgi_pass php-fpm;
            fastcgi_index index.php;
            fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
            include fastcgi_params;
        }

        # Negare accesso ai file nascosti
        location ~ /\. {
            deny all;
        }
    }
}
```

**Cosa fa:**
- Ascolta sulla porta 8080
- Definisce un upstream `php-fpm` che load balance tra 3 server PHP-FPM (php1, php2, php3)
- Usa l'algoritmo `least_conn` per distribuire le connessioni al server meno occupato
- Reindirizza tutte le richieste PHP al backend PHP-FPM
- Protegge i file nascosti (dot files)

## Passaggio 3: Configurare l'Application Server (PHP-FPM)

### File: `php/Dockerfile`

Il Dockerfile include:
- Estensioni MySQL e PDO
- Estensione Redis per sessioni distribuite
- Configurazione PHP personalizzata

### File: `php/php.ini`

Configura le sessioni PHP per usare Redis come storage, permettendo la condivisione delle sessioni tra i tre server PHP-FPM.

## Passaggio 4: Configurare il Database Server (MySQL)

### File: `mysql/init.sql`

Crea il database e una tabella di esempio con dati di test.

## Passaggio 5: Docker Compose - Orchestrazione Completa

### File: `docker-compose.yml`

Contiene la definizione di tutti i servizi:
- 1x HAProxy (load balancer)
- 3x Nginx (web servers)
- 3x PHP-FPM (app servers)
- 1x Redis (cache & sessions)
- 1x MySQL (database)

## Passaggio 6: Avviare l'Architettura

### 1. Posizionati nella cartella del progetto

```bash
cd multitier
```

### 2. Avvia tutti i container

```bash
docker-compose up -d
```

### 3. Verifica lo stato dei container

```bash
docker-compose ps
```

Output atteso:
```
NAME              STATUS        PORTS
load-balancer     Up (healthy)  0.0.0.0:80->80/tcp, 0.0.0.0:8404->8404/tcp
web-server-1      Up (healthy)
web-server-2      Up (healthy)
web-server-3      Up (healthy)
app-server-1      Up (healthy)
app-server-2      Up (healthy)
app-server-3      Up (healthy)
cache-server      Up (healthy)  0.0.0.0:6379->6379/tcp
db-server         Up (healthy)  0.0.0.0:3306->3306/tcp
```

### 4. Accedi all'applicazione

- **Applicazione:** http://localhost/ (via HAProxy load balancer)
- **Dashboard HAProxy:** http://localhost:8404/stats
- **MySQL:** `localhost:3306` (user: root, password: root)
- **Redis:** `localhost:6379`

### 5. Prova il Load Balancing

Ricarica la pagina più volte e osserva:
- **Hostname:** Cambierà tra app-server-1, app-server-2, app-server-3
- **Session Visits:** Aumenterà progressivamente (salvato in Redis)
- **Session ID:** Rimarrà sempre lo stesso

## Status: Tutti i Container in Esecuzione ✓

La tua architettura Docker con load balancing è ora operativa!

```
✓ Load Balancer (HAProxy)      - Porta 80  (punto di ingresso HTTP)
✓ Web Server 1-3 (Nginx)       - Porta 8080 (3 istanze, load balanced)
✓ App Server 1-3 (PHP-FPM)     - Porta 9000 (3 istanze, round-robin)
✓ Session Store (Redis)        - Porta 6379 (Sessioni distribuite)
✓ Database (MySQL)             - Porta 3306 (Database condiviso)
```

## Passaggio 7: Comandi Utili per la Gestione

### Visualizzare i log di un servizio

```bash
# Log del load balancer
docker-compose logs haproxy

# Log di uno specifico web server
docker-compose logs nginx1

# Log di uno specifico app server
docker-compose logs php2

# Log del database
docker-compose logs mysql

# Log in tempo reale
docker-compose logs -f
```

### Eseguire comandi dentro un container

```bash
# Connettersi a un app server
docker exec -it app-server-1 bash

# Connettersi a Redis
docker exec -it cache-server redis-cli

# Connettersi a MySQL
docker exec -it db-server mysql -u root -p app_db

# Eseguire un comando PHP
docker exec app-server-1 php -v
```

### Arrestare e rimuovere i container

```bash
# Arrestare i container
docker-compose down

# Arrestare e rimuovere i volumi (attenzione: cancella i dati!)
docker-compose down -v
```

### Ricostruire le immagini

```bash
# Ricostruire le immagini e avviare
docker-compose up -d --build

# Ricostruire solo un servizio
docker-compose up -d --build php1
```

## Comprendere la Comunicazione tra Container

### Rete Docker (`app-network`)

Tutti i container comunicano tramite una rete bridge privata:

**HAProxy → Nginx (port 8080):**
```
load-balancer:80 → nginx1:8080, nginx2:8080, nginx3:8080
```

**Nginx → PHP-FPM (port 9000):**
```
nginx:8080 → php1:9000, php2:9000, php3:9000 (least_conn)
```

**PHP → MySQL (port 3306):**
```
php:9000 → mysql:3306
```

**PHP → Redis (port 6379):**
```
php:9000 → redis:6379 (sessions)
```

## Algoritmi di Load Balancing

### Round-Robin (HAProxy → Nginx)

HAProxy distribuisce le richieste in modo sequenziale tra i server Nginx:

```
Richiesta 1 → nginx1
Richiesta 2 → nginx2
Richiesta 3 → nginx3
Richiesta 4 → nginx1  ← Ritorna al primo server
Richiesta 5 → nginx2
Richiesta 6 → nginx3
Richiesta 7 → nginx1  ← Ciclo continua
```

**Vantaggi:**
- Semplice e veloce
- Ogni server riceve il carico equamente
- Overhead minimo

**Test:** Aggiorna http://localhost/ più volte e guarda il **Hostname** passare attraverso php1 → php2 → php3 → php1...

### Least Connections (Nginx → PHP-FPM)

Nginx distribuisce le richieste al server PHP-FPM con il **minor numero di connessioni attive**:

```
Se php1 ha 5 connessioni attive
Se php2 ha 2 connessioni attive
Se php3 ha 3 connessioni attive

Prossima richiesta → php2 (ha meno connessioni)
```

**Vantaggi:**
- Intelligente - considera il carico reale del server
- Migliore per richieste di durata variabile
- Bilancia meglio quando i tempi di risposta sono diversi

### Differenza Principale

| Aspetto | Round-Robin | Least Connections |
|---------|------------|-------------------|
| **Logica** | Sequenziale (1→2→3→1) | Basata sul carico |
| **Adatto per** | Richieste simili | Richieste variabili |
| **Complessità** | Bassa | Media |
| **Nel tuo setup** | HAProxy usa questo | Nginx usa questo |

### Flow Completo di una Richiesta

```
Browser
  ↓ (http://localhost/)
HAProxy:80 (round-robin)
  ↓ seleziona nginx1, nginx2 o nginx3 (sequenzialmente)
Nginx:8080 (least connections)
  ↓ seleziona php1, php2 o php3 (basato sul carico)
PHP-FPM:9000
  ↓ (shared session dal browser)
Redis:6379 (recupera la sessione)
  ↓
MySQL:3306 (query al database)
  ↓
Risposta HTML al browser
```

## Vantaggi dell'Architettura

✓ **Alta Disponibilità** - Se un server cade, gli altri continuano
✓ **Scalabilità Orizzontale** - Aggiungi più istanze di Nginx/PHP facilmente
✓ **Load Balancing Intelligente** - Combina round-robin e least connections
✓ **Sessioni Distribuite** - Redis memorizza le sessioni accessibili da tutti
✓ **Stateless App Servers** - Puoi restart un server senza perdere dati
✓ **Monitoraggio** - Dashboard HAProxy per vedere lo stato del sistema

## Esperimenti e Esercizi

### Esercizio 1: Monitorare il Load Balancing

Apri http://localhost:8404/stats per vedere la dashboard di HAProxy in tempo reale.

**Cosa osservare:**
- Backend servers (nginx1, nginx2, nginx3) con stato "UP"
- Numero di connessioni per ogni server
- Bytes in/out per ogni backend
- Sessioni attive

### Esercizio 2: Testare il Fallback (Alta Disponibilità)

```bash
# Arresta un app server
docker-compose stop php2

# Ricarica la pagina - continuerà a funzionare con php1 e php3
# HAProxy lo noterà automaticamente e lo escluderà dal load balancing

# Guarda il dashboard: http://localhost:8404/stats
# php2 apparirà in rosso come "DOWN"

# Riaccendilo
docker-compose start php2

# Dopo alcuni secondi, php2 ritornerà verde "UP"
```

**Concetto imparato:** Alta disponibilità - se un server cade, gli altri continuano!

### Esercizio 3: Verificare le Sessioni Distribuite in Redis

```bash
# Accedi alla CLI di Redis
docker exec -it cache-server redis-cli

# Dentro redis, esegui questi comandi:
KEYS *                          # Vedi tutte le chiavi
INFO keyspace                   # Statistiche database
SCAN 0                          # Scansiona le chiavi
GET "PHPSESSID:abc123"         # Vedi il contenuto di una sessione

# Esci
EXIT
```

**Concetto imparato:** Le sessioni sono memorizzate in Redis, non su disco - accessibili da qualsiasi app server!

### Esercizio 4: Connettersi al Database e Verificare i Dati

```bash
# Accedi a MySQL
docker exec -it db-server mysql -u root -p app_db

# Dentro MySQL, esegui:
SHOW TABLES;                    # Vedi le tabelle
SELECT * FROM users;           # Vedi i dati
INSERT INTO users (name, email) VALUES ('John Doe', 'john@example.com');
SELECT * FROM users;           # Conferma l'inserimento

# Esci
EXIT
```

**Concetto imparato:** MySQL è un database condiviso - tutti gli app server leggono gli stessi dati!

### Esercizio 5: Visualizzare gli Indirizzi IP dei Container

```bash
# Vedi gli IP di tutti i container
docker inspect web-server-1 | findstr IPAddress     # Windows
docker inspect web-server-1 | grep IPAddress        # Linux/Mac

# O più facilmente:
docker network inspect multitier_app-network

# Vedrai qualcosa come:
# nginx1: 172.20.0.5
# php1: 172.20.0.6
# mysql: 172.20.0.3
# redis: 172.20.0.4
```

**Concetto imparato:** I container comunicano tramite una rete bridge privata con indirizzi IP interni!

### Esercizio 6: Leggere i Log in Tempo Reale

```bash
# Log di tutti i servizi
docker-compose logs -f

# Log di un servizio specifico
docker-compose logs -f php1

# Log di HAProxy (vedi il load balancing in azione)
docker-compose logs -f haproxy

# Log di Nginx
docker-compose logs -f nginx1

# Premi CTRL+C per uscire
```

**Concetto imparato:** I log mostrano esattamente cosa sta succedendo in ogni container!

### Esercizio 7: Testare da un'Altra Macchina (Rete Locale)

```bash
# Trova l'IP del tuo host
ipconfig              # Windows
ifconfig              # Linux/Mac
# Cerca "IPv4 Address" (es: 192.168.1.100)

# Da un'altra macchina sulla rete locale, apri il browser:
http://192.168.1.100/
# Dovresti vedere l'applicazione funzionare normalmente
```

**Concetto imparato:** L'applicazione è accessibile da qualsiasi macchina sulla rete!

### Esercizio 8: Aggiungere una 4ª Istanza (Scalabilità)

**Modifica `docker-compose.yml`:**

```yaml
# Aggiungi dopo php3:
  php4:
    build:
      context: ./php
      dockerfile: Dockerfile
    container_name: app-server-4
    volumes:
      - ./php/app:/var/www/html
    depends_on:
      - mysql
      - redis
    networks:
      - app-network
    restart: always
    environment:
      - MYSQL_HOST=mysql
      - MYSQL_USER=root
      - MYSQL_PASSWORD=root
      - MYSQL_DATABASE=app_db
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - APP_SERVER_NAME=php4
```

**Modifica `nginx/nginx.conf` - aggiungi la 4ª istanza:**

```nginx
upstream php-fpm {
    least_conn;
    server php1:9000;
    server php2:9000;
    server php3:9000;
    server php4:9000;    # Aggiungi questa riga
}
```

**Modifica `haproxy/haproxy.cfg`:**

```
backend web-servers
    balance roundrobin
    mode http
    option httpchk GET /
    option forwardfor
    cookie SERVERID insert indirect nocache
    
    server nginx1 nginx1:8080 check cookie nginx1
    server nginx2 nginx2:8080 check cookie nginx2
    server nginx3 nginx3:8080 check cookie nginx3
    # Nota: Nginx non ha bisogno di essere aggiunto qui (scalatura trasparente)
```

**Avvia il nuovo container:**

```bash
docker-compose up -d --build php4
```

**Concept imparato:** Puoi scalare orizzontalmente aggiungendo più istanze senza fermare il sistema!

### Esercizio 9: Monitorare l'Utilizzo delle Risorse

```bash
# Vedi CPU e memoria usata da ogni container
docker stats

# Premi CTRL+C per uscire
```

**Osservazioni:**
- Quale container usa più CPU?
- Quale container usa più memoria?
- Come cambiano i numeri quando ricarichi la pagina?

### Esercizio 10: Testare un Overload Simulato

```bash
# Scarica Apache Bench (tool per stress testing)
# Windows: https://httpd.apache.org/download.cgi
# Linux: sudo apt-get install apache2-utils

# Fai 1000 richieste con 10 client paralleli
ab -n 1000 -c 10 http://localhost/

# Osserva il dashboard HAProxy mentre è in corso:
# http://localhost:8404/stats
```

**Cosa osservare:**
- Come HAProxy distribuisce il carico
- Quale server riceve più richieste
- Se uno dei server diventa troppo carico
- Il tempo medio di risposta

### Esercizio 11: Verifica le Dipendenze tra Container

```bash
# Vedi l'ordine di avvio
docker-compose logs --timestamps

# Osserva che:
# 1. mysql avvia primo
# 2. redis avvia
# 3. php server avviano (dipendono da mysql e redis)
# 4. nginx avvia (dipende da php)
# 5. haproxy avvia (dipende da nginx)
```

**Concetto imparato:** `depends_on` assicura che i servizi si avviano nell'ordine corretto!

### Esercizio 12: Modificare il Codice e Vederlo in Tempo Reale

```bash
# Modifica php/app/index.php (aggiungi un commento)
# Salva il file

# Aggiorna il browser - il cambiamento appare istantaneamente
# Perché? Perché ./php/app è un bind mount!
```

**Concetto imparato:** I bind mount permettono lo sviluppo live senza rebuild!

## Troubleshooting

### Il browser mostra "Connection refused"

```bash
# Verifica che HAProxy sia in esecuzione
docker-compose logs haproxy

# Verifica che la porta 80 sia disponibile
netstat -an | findstr :80  # Windows
```

### La sessione non è condivisa tra i server

```bash
# Verifica che Redis sia in esecuzione
docker-compose logs redis

# Verifica la connessione a Redis
docker exec app-server-1 ping -c 1 redis
```

### Un app server continua a fallire

```bash
# Leggi i log dettagliati
docker-compose logs php1

# Riconstruisci il container
docker-compose up -d --build php1
```

## Conclusione

Hai creato un'architettura **production-ready** multi-tier con:

✓ **Load Balancer** - Distribuzione del traffico
✓ **Multiple Instances** - Scalabilità orizzontale
✓ **Distributed Sessions** - Redis per le sessioni
✓ **Health Checks** - Failover automatico
✓ **Monitoraggio** - Dashboard HAProxy

Questa è un'architettura moderna e realistica che puoi adattare alle tue esigenze specifiche!
