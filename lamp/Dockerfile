FROM php:8.2-apache

# Installa estensioni PHP utili (pdo_mysql per MySQL)
RUN docker-php-ext-install mysqli pdo pdo_mysql

# Abilita mod_rewrite per Apache
RUN a2enmod rewrite

# Imposta cartella di lavoro
WORKDIR /var/www/html