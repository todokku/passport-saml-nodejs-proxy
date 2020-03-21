# passport-saml-nodejs-proxy

## add new tenant xyz
- update config.json (self expalnatory) for xyz
- create folder xyz
- copy certificate from idp to file xyz/idp-cert.pem
- restart app

## references
    openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -nodes -days 900 -subj "/C=CA/ST=ON/L=Brampton/O=malotian's lab/OU=Security/CN=passport-saml-nodejs-proxy.example.com"
