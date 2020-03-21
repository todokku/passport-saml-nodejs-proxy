# passport-saml-nodejs-sample

## add new tenant xyz
- update config.json (self expalnatory) for xyz
- create folder xyz
- copy certificate from idp to file xyz/idp-cert.pem
- restart app

## references
    openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -nodes -days 900 -subj "/C=US/ST=CA/L=Mountain View/O=TeamzSkill, Inc/OU=Security/CN=teamzskill.com"
