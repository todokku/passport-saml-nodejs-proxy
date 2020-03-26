# description
`passport-saml-nodejs-proxy` is a nodejs based application, that acts as 
1. revrese proxy. 
2. saml service provider (only authenticated requests can pass through proxy)

# why nodejs based custom reverse proxy is preffered (instead of standard apache/nginx reverse proxy)
1. small footprint
2. fits with existing application stack
3. no additional component/dependencies to install
4. **programmable/flexible/extensible**
5. **jwt composition/managment**
6. **easy logging/tracing/debugging**
7. **multi idp support**
8. **highly configurable**

# add new saml-idp provider xyz
1. update `config.json` (self expalnatory) for `xyz`
2. create folder `xyz`
3. copy certificate from idp metdadata to file `xyz/idp-cert.pem`
4. restart `passport-saml-nodejs-proxy` app
  
# docker test

 1. build docker images/containers using `docker-compose build` 
 2. run docker containers using `docker-compose up` 
 3. add `127.0.0.1 cerpassrx-saml-proxy-ex.azurewebsites.net cerpassrx-dev.azurewebsites.net` to `/etc/hosts`
 4. browse   `https://cerpassrx-saml-proxy-ex.azurewebsites.net`

# appendix
`openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -nodes -days 900 -subj "/C=US/ST=CA/L=Mountain View/O=TeamzSkill, Inc/OU=Security/CN=teamzskill.com"`

## azure cli script

    SUBSCRIPTION="Azure subscription 1"
    RESOURCEGROUP="appsvc_linux_centralus"
    LOCATION="centralus"
    PLANNAME="appsvc_linux_centralus"
    PLANSKU="F1"
    SITENAME="cerpassrx-saml-proxy-ex"
    RUNTIME="NODE|12-lts"
    
    # login supports device login, username/password, and service principals
      # see https://docs.microsoft.com/en-us/cli/azure/?view=azure-cli-latest#az_login
      az login

    # list all of the available subscriptions
    az account list -o table
    # set the default subscription for subsequent operations
    az account set --subscription $SUBSCRIPTION
    # create a resource group for your application
    az group create --name $RESOURCEGROUP --location $LOCATION
    # create an appservice plan (a machine) where your site will run
    az appservice plan create --name $PLANNAME --location $LOCATION --is-linux --sku $PLANSKU --resource-group $RESOURCEGROUP
    # create the web application on the plan
    # specify the node version your app requires
    az webapp create --name $SITENAME --plan $PLANNAME --runtime $RUNTIME --resource-group $RESOURCEGROUP
    
    # To set up deployment from a local git repository, uncomment the following commands.
    # first, set the username and password (use environment variables!)
    # USERNAME=""
    # PASSWORD=""
    # az webapp deployment user set --user-name $USERNAME --password $PASSWORD
    
    # now, configure the site for deployment. in this case, we will deploy from the local git repository
    # you can also configure your site to be deployed from a remote git repository or set up a CI/CD workflow
    # az webapp deployment source config-local-git --name $SITENAME --resource-group $RESOURCEGROUP
    
    # the previous command returned the git remote to deploy to
    # use this to set up a new remote named "azure"
    # git remote add azure "https://$USERNAME@$SITENAME.scm.azurewebsites.net/$SITENAME.git"
    # push master to deploy the site
    # git push azure master
    
    # browse to the site
    # az webapp browse --name $SITENAME --resource-group $RESOURCEGROUP
