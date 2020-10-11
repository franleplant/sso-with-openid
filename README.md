# OpenId for SSO (single sign on) with NodeJS and Typescript


## How to run


To simply see how you can build an app using an OpenId provider
as the main authentication authority then just go to your Google Api Console
and create a new app and a new set of OAuth credentials.

Copy `.env.example` into `.env` and fill the values with what Google gave you.

Don't forget to add `URI` and `redirect URI` in your Google Console,
the ovbious thing you need to add is `http://localhost` and `http://localhost/auth/callback`.

And then you simple `yarn start`.


If you want to see how mutliple different apps (OAuth Clients) can achieve Single Sign On
using a single OpenId provider such as google (or your companie's internal one) then you need 
to create a second OAuth client and get a second set of OAuth credentials, and now you are going to fill
two `.env` files, one is `.env.client1` and the second is ..., you guessed, `.env.client2`, the format is still
the same.

And then you run two instances of the same code as two separate Oauth clients: `yarn start:client1` and `yarn start:client2`.

To really observe that they are complete distinct in terms of how the store session cookies and such you need
to ensure they run in different domains because otherwise the cookies will collide in the same domain `localhost` without
the port, one nice way of achieve that is runing one app in `localhost` and the other in `127.0.0.1`.
