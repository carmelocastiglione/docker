## 1. Struttura del progetto

Crea una cartella per il tuo ambiente di sviluppo, ad esempio:

lamp-docker/
│── docker-compose.yml
│── Dockerfile
│── html/               (contiene i file del progetto)
│    └── index.php
│── db_data/            (qui Docker salverà i dati di MySQL)

---

## 2. File `docker-compose.yml`

Ecco un esempio di configurazione:

```yaml
version: '3.8'

services:
  apache:
    build:
      dockerfile: Dockerfile
    container_name: lamp-apache
    ports:
      - "8080:80"   # Apache disponibile su localhost:8080
    restart: always
    volumes:
      - ./html:/var/www/html   # codice PHP
    depends_on:
      - db

  db:
    image: mysql
    container_name: lamp-mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: lamp_db
      MYSQL_USER: lamp_user
      MYSQL_PASSWORD: lamp_pass
    ports:
      - "3306:3306"
    volumes:
      - ./db_data:/var/lib/mysql

  phpmyadmin:
    image: phpmyadmin/phpmyadmin
    container_name: lamp-phpmyadmin
    restart: always
    environment:
      PMA_HOST: db
      MYSQL_ROOT_PASSWORD: root
    ports:
      - "8888:80"
    depends_on:
      - db
```

---

## 3. File `Dockerfile`

Serve per avere Apache + PHP nello stesso container:

```dockerfile
FROM php:8.2-apache

# Installa estensioni PHP utili (pdo_mysql per MySQL)
RUN docker-php-ext-install mysqli pdo pdo_mysql

# Abilita mod_rewrite per Apache
RUN a2enmod rewrite

# Imposta cartella di lavoro
WORKDIR /var/www/html
```

---

## 4. File `html/index.php`

Un piccolo test PHP:

```php
<?php
phpinfo();
```

---

## 5. Avvio dei container

Nella cartella del progetto:

```bash
docker-compose up -d --build
```

---

## 6. Accesso ai servizi

* **PHP/Apache** → [http://localhost:8080](http://localhost:8080)
* **phpMyAdmin** → [http://localhost:8888](http://localhost:8888)
  (user: `lamp_user`, pass: `lamp_pass`, DB: `lamp_db`)
* **MySQL** → Porta `3306`, root password `root`

---

