Below you can find the documentation for Bureau's API

All endpoints use HTTP POST. You supply a JSON object with some authentication
and possibly additional parameters depending on the endpoint.

## Getting started

### Authentication

To get authentication tokens to access the API you first need an App Token.
You can request one from [archon@assassinsbureau.org](mailto:archon@assassinsbureau.org?Subject=App%20Token%20Request)

Once you have an App Token you are free to make requests to the API.
To make any useful requests though, you first need a User ID and a
User Token. Just as the App Token identifies the application, the
User ID and Token identify and authenticate the user. To get the ID
and Token you send a request to api.assassinsbureau.org/auth/login
with the user's email and password along with the app token. The API
will respond with a User ID and Token. All data sent to and received
from the API will be in JSON format.


#### Request

```http
POST /auth/login HTTP/1.1
Host: api.assassinsbureau.org
Content-Type: application/json
```

```json
{   
    "APP_TOKEN": "my-fancy-app-token",
    "email": "super.developer.assassin@example.com",
    "password": "letmein123"
}
```

#### Response

```json
{   
    "USER_ID": "ae6610525036861ecf12eb07",
    "USER_TOKEN": "a77237b302a69.7434ed688.2710a8d492"
}
```

You may keep using this ID and token until the API tells you that
the token has expired and no longer valid, at which point you should
request a new token.


### Gotchas

 - You must send the request with the HTTP "Content-Type" header set
   to "application/json"

 - You can only send requests with the HTTP POST method!

 - Check the human readable errors returned to find out what
   went wrong


**And now for some examples of what you can do once you've been authenticated!**

---

## Examples with no extra parameters

#### Fetching killmethods

```http
POST /killmethods/getKillMethods HTTP/1.1
Host: api.assassinsbureau.org
Content-Type: application/json
```

```json
{   
    "APP_TOKEN": "my-fancy-app-token",
    "USER_ID": "ae6610525036861ecf12eb07",
    "USER_TOKEN": "a77237b302a69.7434ed688.2710a8d492"
}
```

This will return the list of kill methods for the gamegroup
pertaining to the user who made API call

#### Getting assassin data

```http
POST /assassin/getAssassin/ae6610525036861ecf12eb07 HTTP/1.1
Host: api.assassinsbureau.org
Content-Type: application/json
```

```json
{   
    "APP_TOKEN": "my-fancy-app-token",
    "USER_ID": "ae6610525036861ecf12eb07",
    "USER_TOKEN": "a77237b302a69.7434ed688.2710a8d492"
}
```

This will return data for the assassin 'ae6610525036861ecf12eb07'

---

## Examples with parameters

#### Querying kill reports

```http
POST /killmethods/getKillMethods HTTP/1.1
Host: api.assassinsbureau.org
Content-Type: application/json
```

```json
{   
    "APP_TOKEN": "my-fancy-app-token",
    "USER_ID": "ae6610525036861ecf12eb07",
    "USER_TOKEN": "a77237b302a69.7434ed688.2710a8d492",
    "query": {
        "killmethod": "melee",
        "state": "rejected"
    }
}
```

This will return the list of all kill reports in your gamegroup that
have been rejected where the kill method was a melee weapon.


#### Searching for assassins

```http
POST /assassin/searchAssassinsByName HTTP/1.1
Host: api.assassinsbureau.org
Content-Type: application/json
```

```json
{   
    "APP_TOKEN": "my-fancy-app-token",
    "USER_ID": "ae6610525036861ecf12eb07",
    "USER_TOKEN": "a77237b302a69.7434ed688.2710a8d492",
    "name": "Jon"
}
```

This will return the list of all assassins whose name contains the
substring "jon"
