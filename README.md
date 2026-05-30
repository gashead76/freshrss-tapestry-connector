# freshrss-tapestry-connector
This is a connector for Iconfactory's app Tapestry that connects to a FreshRSS instance. Its got some personal tricks to it that may not be useful to other folks however.

I still need to write up all its features, but it can log into your FreshRSS instance using your **API password** (don't use your actual account password). It will, by default, mark the 50 articles it pulls from your instance as read on the server (can be toggled off). There are action button in Tapestry that will allow you to mark read / unread, star (favorite), and add a label of your choosing (i use the label "Released" because i also use the app Current for iOS and that helps keep things organized).

It seems pretty solid and does all the things i want it to do. It does have some ugly edges in the settings page for the connector, but nothing breaking.

I did use machine models to help me develop this connector, I had not writtin javascript in a thousand years.
