# Deployment Configs

Reference copies of production deployment files for NabzChat.

## Structure

- `nginx/`  Nginx server configs
  - `nabzchat.conf`  serves `nabzchat.tech` (static coming-soon), `www.nabzchat.tech`, `app.nabzchat.tech` (React app on port 3000)
  - `adminer.conf`  serves the Adminer database panel on `admin-x7k2m9.nabzchat.tech` (behind Nginx Basic Auth)
- `static-coming-soon/`  Static HTML for the coming-soon page
  - `index.html`  main page (waitlist via Formspree)
  - `404.html`  404 error page

## Where these live on the live server

- Static HTML: `/var/www/nabzchat-soon/`
- Nginx configs: `/etc/nginx/sites-available/` (symlinked into `sites-enabled/`)
- Adminer PHP: `/var/www/adminer/` (download from https://www.adminer.org/)
- Basic Auth password file: `/etc/nginx/.nabzchat-adminer-auth` (NEVER commit)

## NOT included in git

- `.htpasswd` / Basic Auth password hashes (secrets)
- Adminer `index.php` (easy to re-download from adminer.org)
- `.env` files (secrets)
- Database files `*.db` (user data, huge)
- PHP-FPM default configs (Ubuntu standard)
