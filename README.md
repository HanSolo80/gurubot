<h1 align="center">gurubot</h1>
<p align="center">
    <a title='Build Status' href="https://travis-ci.org/HanSolo80/gurubot">
        <img src='https://travis-ci.org/HanSolo80/gurubot.svg?branch=master' alt='travis Status' />
    </a>
    <a title='coveralls Status' href='https://coveralls.io/r/HanSolo80/gurubot'>
        <img src='https://img.shields.io/coveralls/HanSolo80/gurubot.svg' alt='Coverage Status' />
    </a>
</p>
<p align="center">
    <a title='closed issue' href='http://issuestats.com/github/HanSolo80/gurubot'>
        <img src='http://issuestats.com/github/HanSolo80/gurubot/badge/issue' alt='issue stats' />
    </a>
    <a title='blog' href=''>
       <img src='https://img.shields.io/badge/style-blog-blue.svg?label=my' alt='blog' />
    </a>
</p>

## About gurubot
>gurubot is a  node.js slack bot.
Bot of the Guru

## Bot Command list

* Just to start type hello in the general chat after invited the bot in it
   
    ``` hello  ```


## Install Getting Started
1. Create a new [bot integration](https://my.slack.com/services/new/bot)
1. Choose between **One-Click Heroku** or **Manual Heroku**

 - **One-Click Heroku**
       Click this button:

       [![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

 - **Manual Heroku**
    *  Install [Heroku toolbelt](https://devcenter.heroku.com/articles/getting-started-with-nodejs#set-up)
    * Create a new bot integration (as above)
    *  `heroku create`
    *  `heroku config:set TOKEN_SLACK=[Your Slack bot integration token (obtainable at https://my.slack.com/services/new/bot)]`
    *  `git push heroku master`


## Development

* To test gurubot

    ```$ npm run-script test```

* To debug gurubot

    ```$ npm run-script debug```

* To see the test coverage gurubot

    ```$ npm run-script coverage```

* To run gurubot on your machine

    ```$ npm run-script start```

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b gurubot`
3. Commit your changes: `git commit -a `
4. Push to the branch: `git push origin gurubot`
5. Submit a pull request

## History

For detailed changelog, check [Releases](https://github.com/HanSolo80/gurubot/releases).

### Contributors

Contributor | GitHub profile | 
--- | --- | ---
Christoph Kau  (Creator) | [HanSolo80](https://github.com/HanSolo80) | 

