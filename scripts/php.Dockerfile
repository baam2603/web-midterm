FROM php:8.3-cli
RUN apt-get update && apt-get install -y --no-install-recommends libonig-dev && docker-php-ext-install -j2 pdo_mysql mbstring && rm -rf /var/lib/apt/lists/*
WORKDIR /app
