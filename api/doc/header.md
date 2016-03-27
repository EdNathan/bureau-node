Below you can find the documentation for Bureau's API

All endpoints use HTTP POST. You supply a JSON object with some authentication and possibly additional parameters depending on the endpoint.

---

## Examples with no parameters

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
    "USER_TOKEN": "a77237b302a697434ed6882710a8d492"
}
```

This will return the list of kill methods for the gamegroup pertaining to the user who made API call

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
    "USER_TOKEN": "a77237b302a697434ed6882710a8d492"
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
    "USER_TOKEN": "a77237b302a697434ed6882710a8d492",
    "query": {
        "killmethod": "melee",
        "state": "rejected"
    }
}
```

This will return the list of all kill reports in your gamegroup that have been rejected where the kill method was a melee weapon.


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
    "USER_TOKEN": "a77237b302a697434ed6882710a8d492",
    "name": "Jon"
}
```

This will return the list of all assassins whose name contains the substring "jon"
