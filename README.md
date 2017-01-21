# Slash Webtask for Pingdom Checks

If you are monitoring your websites using Pingdom and you also spend a decent in Slack this you can [install Slash Webtask](https://webtask.io/slack) and get up and running easily.  

## Installation

Installation of Slash Webtask is a breeze.  Head on over to [Webtask.io](https://webtask.io/slack) and click the `Add to Slack` button.

Once you have it installed you are ready to go.

## Setting up a Slash Webtask

In a channel or DM enter the message `/wt make pingdom-checks`.  You can replace `pingdom-checks` with any command name you'd prefer.  

Then click on the `Edit in Webtask Editor` link.  This will take you to the online IDE for creating webtasks.

In this editor window copy the contents of [webtask.js](https://raw.githubusercontent.com/sgmeyer/slash-wt-pingdom-checks/master/webtask.js) over to the IDE and click save.

Once you've saved it you'll need to setup your secrets.  To edit secrets click the key icon on the right navigation.  The tool tip will display secrets.  This opens the secrets editor window.  Here you'll need to add two secrets:

* pingdom_api_key where the value is your Pingdom App Key.
* pingdom_credentials where the value is you PingdomUsername:Password

Note: Pingdom uses basic authentication for its API.  This means you'll need to use the format: sgmeyer@gmail.com:P4ssw0rd!

Hit save one more time.  Now go back to Slack and try it out.  `/wt pingdom-checks`.

## Letting Other Users Use You Slack Webtask

Creating meaningful Slash Webtasks is easy and fun.  To allow anyone in your organization to run your code run this in a DM `/wt acl add user pingdom-checks *` and that is it.  You are making sweet monitoring magic.
