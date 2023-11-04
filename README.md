# url-shortener
This is a service to shorten long urls.

## User Service
fields: email, password, tier(either 1 or 2, requests
functions: register, login. Modify not provided because the major part is url shortener.
Note: a user have a maximum number of short urls based on tier.
## Url Shortener Service
### functions
1. input a long url and return a short one, users can try to give an optional preferred one.

I. a user can have multiple shortened urls for one single long url.

II. preferred field is optional.

III. if given preferred but not available, it will just return without generating another one.

IV. if users don't provide preferred, return a random one.

Note: if base url never change, we can just store short code, but there is a function to print urls of a user, to make the result more readable(same as the actual url they need to input in browser), we still store complete urls.

2. see all urls of a given user.
return long and short url pairs
3. redirect to corresponding long url by a short one input.
4. delete short url of a user.

## Run Steps
1. clone the repository
2. npm install
3. configure .env file correctly
4. npm start
5. test the api, no GUI provided.
