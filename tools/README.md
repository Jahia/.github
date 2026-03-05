This folder contains tools and scripts useful when using GitHub

# TamperMonkey

Using the script tampermonkey-support-tickets.js

After installer the Chrome Extension "Tampermonkey", this script will build links to Jira tickets from the "Jira tickets" field in the Customers project.

<img src="./docs/link-jira-tickets.png" witdh= "800" />

To install:
 - Install Tampermonkey chrome extension
 - Click on the "+" to add an extension
 - Copy/paste the content of the file.

Troubleshooting:
- I installed Tampermonkey and added the script, but it's not running.
Ensure you enabled "Developer mode" under Google Chrome --> Extensions - Manage Extensions
(You might need to restart your browser to make it effective.)
![image](https://github.com/user-attachments/assets/b34b75f1-1ed0-4d98-80fd-3b8ccaafb10e)

# GitHub Issues notifications

Although we do strongly recommend the use of Scheduled Reminders in GitHub, this only works for Pull Requests. Meaning notifications about `@mention` in GitHub Issues will not trigger notifications in Slack.

Two options are available to cover for that missing feature and avoid missing notifications:
 - Use slack emails in GitHub (preferred, more resource friendly)
 - Use a dedicated push to Slack workflow.

## Option A: Slack emails in GitHub

GitHub allows you to send email notifications for repository activity to any email address. By using Slack's channel-specific email address, you can forward GitHub notifications directly to a Slack channel.

### Step-by-Step Instructions

#### 1. Get Your Slack Channel Email Address

1. In Slack, open (or create) the channel where you want to receive notifications
2. Click the channel name at the top
3. Select **Integrations** → **Apps**
4. Look for the email integration or search for "Email" app
5. Copy the unique email address for that channel

#### 2. Configure GitHub Email Notifications

1. Navigate to your GitHub repository
2. Click **Settings** (under the repository name)
3. In the left sidebar, under "Integrations," click **Email notifications**
4. In the **Address** field, paste your Slack channel email address
5. Optionally add a second email address if needed
6. Click **Setup notifications**

You will now receive these emails to your Slack channel

## Option B: Push to Slack workflow

To address the absence of "Scheduled Reminders" for GitHub Issues, you can configure a GitHub Actions workflow that collects your GitHub notifications, filters them based on custom rules, and pushes them to Slack.

**Note**: This action only forwards notifications present in https://github.com/notifications. If you have too many or too few notifications, check your notifications settings first.

### Step-by-Step Instructions

#### 1. Create a GitHub Personal Access Token

1. Go to **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Click **Generate new token (classic)**
3. Give it the **notifications** scope only
4. Copy and save the token securely

#### 2. Configure the Token in the delivery repo

1. Contact your Delivery Manager
2. Request they add the token to https://github.com/Jahia/delivery
3. The variable should be named `GH_NOTIFICATIONS_[USERNAME]`

#### 3. Get Your Slack User ID

1. In Slack, right-click on your username
2. Select **View profile**
3. Click the vertical dots (**⋮**)
4. Select **Copy member ID**

#### 4. Create Your Notifications Workflow

1. Open a PR in the https://github.com/Jahia/delivery repository
2. Create a new workflow file: `notifications-[USERNAME].yml`
3. Use existing workflows in the repository as inspiration
4. Configure filtering rules based on your preferences

#### 5. Complete the Setup

1. After receiving the first Slack message, add the "GitHub Notifications" app to your VIP group for better visibility
2. Visit https://github.com/notifications
3. Click the checkbox at the top left → **Select all notifications** → **Done**
4. This clears your backlog so you start fresh

### Notification Modes

Choose the behavior that fits your workflow:

- **Batch mode**: One message containing all notifications since the last run — ideal for reviewing multiple notifications at once
- **Individual mode**: One message per notification — better for near real-time updates (though not truly real-time)

### Resource Considerations

Each workflow run takes less than 10 seconds on the smallest available machines. Be mindful of scheduling frequency to avoid over-consuming resources.
