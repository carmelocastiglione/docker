FROM php:8.2-fpm

# Installare estensioni PHP necessarie
RUN docker-php-ext-install mysqli pdo pdo_mysql

# Installare Redis extension
RUN pecl install redis && docker-php-ext-enable redis

# Copiare la configurazione PHP per Redis sessions
COPY php.ini /usr/local/etc/php/

# Copiare l'applicazione nel container
COPY app/ /var/www/html/

# Impostare i permessi corretti
RUN chown -R www-data:www-data /var/www/html

EXPOSE 9000

CMD ["php-fpm"]