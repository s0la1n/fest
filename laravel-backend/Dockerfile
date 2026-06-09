FROM composer:2.8 AS vendor
WORKDIR /app
COPY composer.json composer.lock artisan ./
COPY bootstrap bootstrap
COPY app app
COPY config config
COPY database database
COPY routes routes
COPY resources resources
RUN composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader

FROM php:8.3-fpm-alpine
WORKDIR /var/www/html
RUN apk add --no-cache libxml2-dev curl-dev oniguruma-dev linux-headers \
    && docker-php-ext-install -j"$(nproc)" pdo_mysql mbstring bcmath opcache xml curl \
    && apk del linux-headers \
    && rm -rf /tmp/*
COPY docker/php-opcache.ini /usr/local/etc/php/conf.d/opcache.ini
COPY --chown=www-data:www-data . .
COPY --from=vendor --chown=www-data:www-data /app/vendor ./vendor
COPY docker/entrypoint.sh /usr/local/bin/app-entrypoint
RUN chmod +x /usr/local/bin/app-entrypoint \
    && mkdir -p storage/app/public storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache
ENTRYPOINT ["app-entrypoint"]
CMD ["php-fpm", "-F"]
