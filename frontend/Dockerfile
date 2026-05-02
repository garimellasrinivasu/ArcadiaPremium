# Use Apache 2.4 on Alpine for a small footprint
FROM httpd:2.4-alpine

# 1. Enable necessary proxy modules in the base config
RUN sed -i 's/#LoadModule proxy_module/LoadModule proxy_module/' /usr/local/apache2/conf/httpd.conf && \
    sed -i 's/#LoadModule proxy_http_module/LoadModule proxy_http_module/' /usr/local/apache2/conf/httpd.conf && \
    sed -i 's/#LoadModule slotmem_shm_module/LoadModule slotmem_shm_module/' /usr/local/apache2/conf/httpd.conf

# 2. Copy the 'dist' folder (downloaded by GitHub Actions) into Apache's document root
# Note: GitHub Actions download-artifact places files in frontend/dist
COPY dist/ /usr/local/apache2/htdocs/

# 3. Copy your custom VirtualHost/Proxy config to the 'extra' folder
COPY my-apache.conf /usr/local/apache2/conf/extra/my-app.conf

# 4. Tell the main httpd.conf to load your custom config
RUN echo "Include conf/extra/my-app.conf" >> /usr/local/apache2/conf/httpd.conf

EXPOSE 80