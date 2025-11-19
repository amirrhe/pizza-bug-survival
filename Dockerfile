# Use a tiny Nginx image
FROM nginx:alpine

# Remove default nginx static files
RUN rm -rf /usr/share/nginx/html/*

# Copy our static files into nginx's web root
COPY index.html /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/
COPY game.js /usr/share/nginx/html/

# Expose port 80 (inside the container)
EXPOSE 80

# Run nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
