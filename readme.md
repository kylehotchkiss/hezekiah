# DonateServ

DonateServ is open source donation processing and campaign management software.

Based on a few conditions, you may want to consider DonateServ for your own organization. You'll need to be using Stripe for card processing, for starters. You'll also need Google Apps for access to the admin panel. And of course, you'll need some technical background to set this all up on Heroku and Postgres and hook it up to your site.

While this software is open-source and free for you to use, hosting it can become pricy. Heroku's cheapest production database is $50 a month, along with any SSL and extra dyno fees that you'll want to pay (You can piggyback off of Heroku's free SSL of course).

## What DonateServ is

* Stripe-based donation processing for one-time and recurring donations
* Campaign creation and reporting software 
* Freedom to build donation pages from scratch on your website, while retaining PCI compliance (via Stripe) keeping donation processing costs down.
* Campaign-oriented connections with Mailchimp

## What DonateServ isn't

* Accounting software (there is no way to withdrawal from a campaign account to see current balance, for example)
* Multi-origin donation distribution software. All donations will go to one Stripe account, under the assumption that you will take care of distributions from there.
* A CRM for donors. While we connect to Mailchimp and Mandrill for emailing purposes, we don't have the details you may want for your donors. I'm perfectly okay with Mailchimp's segmenting, because Mailchimp is good software.

## TODO:

* Reject non-https donations
* Remove users from recurring campaigns when they unsubscribe

## This is neat! How can I thank you?

Thanks! DonateServ was originally built for my personal nonprofit, [Illuminate Nations](http://www.illuminatenations.org). We support a variety of children's homes across southern Asia and are supporting programs to help women coming out of the sex trade industry. Please take a look at what we're doing, and if DonateServ has helped your own fundraising efforts, please consider a donation.
