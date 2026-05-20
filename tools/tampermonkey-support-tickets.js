// ==UserScript==
// @name         GitHub Issue Jira Links
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  Add clickable Jira ticket links from the "Jira tickets" project field. Works in both issue pages and project board pane views.
// @author       Fgerthoffert
// @match        https://github.com/*/*/issues/*
// @match        https://github.com/*/*/projects/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const cfgJiraBaseURL = 'https://support.jahia.com/browse/';
    const cfgTicketsFieldName = 'Jira tickets';
    const cfgIssueEventsBaseURL = 'https://zencrepes.jahia.com/zindex/';
    const JIRA_SECTION_ID = 'tampermonkey-jira-links';

    // --- View detection ---

    function isProjectPaneView() {
        const url = window.location.href;
        return url.includes('/projects/') && url.includes('pane=issue');
    }

    function isIssueView() {
        return window.location.href.includes('/issues/');
    }

    // --- DOM helpers ---

    function removeExistingJiraSection() {
        const existing = document.getElementById(JIRA_SECTION_ID);
        if (existing) existing.remove();
    }

    // --- Issue view: find projects in sidebar ---

    function findAllProjectsInSidebar() {
        const projectsSidebar = document.querySelector('[data-testid="sidebar-projects-section"]');
        if (!projectsSidebar) {
            console.log("[Jira Links] No projects sidebar found");
            return [];
        }
        const container = projectsSidebar.querySelector('div:nth-child(2) > div');
        if (!container) {
            console.log("[Jira Links] No project entries container found");
            return [];
        }
        const projectEntries = Array.from(container.children);
        console.log("[Jira Links] Found " + projectEntries.length + " project(s) in sidebar");
        return projectEntries;
    }

    function expandProject(project) {
        if (!project) return;
        if (!project.textContent.includes(cfgTicketsFieldName)) {
            const expandButton = project.querySelector('[data-component="IconButton"]');
            if (expandButton) {
                console.log("[Jira Links] Expanding project");
                expandButton.click();
            }
        }
    }

    function getTicketsFieldFromProject(project) {
        const ul = project.querySelector('div > ul');
        if (!ul) return undefined;
        const fields = Array.from(ul.children);
        for (const field of fields) {
            if (field.textContent.includes(cfgTicketsFieldName)) {
                const spans = field.querySelectorAll('li > span > button > span');
                if (spans && spans.length > 1) {
                    return spans[1].textContent;
                }
            }
        }
        return undefined;
    }

    // --- Project pane view: find tickets in the issue pane sidebar ---

    function getTicketsFromProjectPane() {
        // In project pane view, project fields are displayed in the issue detail sidebar.
        // Look for the "Jira tickets" field label and its adjacent value.
        const allText = document.querySelectorAll('span, div, label');
        for (const el of allText) {
            if (el.textContent.trim() === cfgTicketsFieldName && el.closest('[class*="sidebar"], [class*="Sidebar"], [data-testid*="sidebar"], [role="complementary"]')) {
                // Found the label, look for the value in the parent container
                const container = el.closest('div[class]') || el.parentElement;
                if (container) {
                    const buttons = container.querySelectorAll('button > span');
                    for (const btn of buttons) {
                        const text = btn.textContent.trim();
                        if (text && text !== cfgTicketsFieldName && !text.includes("Enter text")) {
                            return text;
                        }
                    }
                }
            }
        }

        // Fallback: search for the field in any visible project field list in the pane
        const fieldGroups = document.querySelectorAll('[data-testid="issue-sidebar"] ul, [role="complementary"] ul');
        for (const ul of fieldGroups) {
            const items = Array.from(ul.children);
            for (const item of items) {
                if (item.textContent.includes(cfgTicketsFieldName)) {
                    const spans = item.querySelectorAll('li > span > button > span, span > button > span');
                    if (spans && spans.length > 1) {
                        return spans[1].textContent;
                    }
                    // Try broader search within the item
                    const allSpans = item.querySelectorAll('span');
                    for (const span of allSpans) {
                        const text = span.textContent.trim();
                        if (text && text !== cfgTicketsFieldName && !text.includes("Enter text") && /[A-Z]+-\d+/.test(text)) {
                            return text;
                        }
                    }
                }
            }
        }

        // Last resort: scan the entire pane for a text pattern matching tickets near the field name
        const pane = document.querySelector('[data-testid="side-panel"], [class*="pane"], [class*="Panel"]');
        if (pane) {
            const items = pane.querySelectorAll('li, div');
            for (const item of items) {
                if (item.textContent.includes(cfgTicketsFieldName)) {
                    const spans = item.querySelectorAll('span');
                    for (const span of spans) {
                        const text = span.textContent.trim();
                        if (text && text !== cfgTicketsFieldName && /^[A-Z]+-\d+/.test(text)) {
                            return text;
                        }
                    }
                }
            }
        }

        return undefined;
    }

    // --- Ticket parsing ---

    function getTicketIds(ticketsFieldContent) {
        if (!ticketsFieldContent || ticketsFieldContent.includes("Enter text")) {
            return [];
        }
        return ticketsFieldContent
            .trim()
            .split(',')
            .map(ticket => ticket.trim())
            .filter(ticket => ticket.length > 0 && /^[A-Z]+-\d+$/.test(ticket));
    }

    // --- Rendering ---

    function createJiraSection(ticketIDs, jiraBaseURL, targetContainer) {
        console.log("[Jira Links] Creating links for tickets: ", ticketIDs);
        removeExistingJiraSection();

        const jiraSection = document.createElement('div');
        jiraSection.id = JIRA_SECTION_ID;
        jiraSection.style.marginTop = '20px';

        jiraSection.innerHTML = `
          <div style="display: flex; align-items: center; gap: 2px; font-size: 14px;">
              <span style="font-size: 12px; font-weight: bold;">Jira Tickets:</span>
              <div style="display: flex; flex-wrap: nowrap; gap: 10px; overflow-x: auto;">
                  ${ticketIDs
                    .map(ticketID => `<span style="background-color: #f1f8ff; padding: 5px 10px; border-radius: 5px; white-space: nowrap; font-size: 12px;"><a href="${jiraBaseURL}${ticketID}" target="_blank" style="text-decoration: none; color: #0366d6;">${ticketID}</a></span>`)
                    .join('')}
              </div>
          </div>
      `;

        if (targetContainer) {
            targetContainer.appendChild(jiraSection);
        }
    }

    function findTargetContainer() {
        // Issue view: metadata section
        const issueMetadata = document.querySelector('[data-testid="issue-metadata-fixed"] > div');
        if (issueMetadata) return issueMetadata;

        // Project pane view: try the issue body/header area within the pane
        const paneBody = document.querySelector('[data-testid="side-panel-body"]');
        if (paneBody) return paneBody;

        // Fallback: look for the issue body in the pane
        const issueBody = document.querySelector('[data-testid="issue-body"]');
        if (issueBody) return issueBody.parentElement;

        // Another fallback for project pane: the pane's first scrollable div
        const pane = document.querySelector('[class*="pane"] [class*="content"], [role="complementary"]');
        if (pane) return pane;

        return null;
    }

    // --- Issue object extraction ---

    function getIssueObject(url) {
        const urlObj = new URL(url);
        const pathSegments = urlObj.pathname.split('/');

        let organization, repository, number;

        if (url.includes('/issues/')) {
            organization = pathSegments[1];
            repository = pathSegments[2];
            number = pathSegments[4];
        } else if (url.includes('/projects/')) {
            const issueParam = urlObj.searchParams.get('issue');
            if (issueParam) {
                const issueParts = issueParam.split('|');
                organization = issueParts[0];
                repository = issueParts[1];
                number = issueParts[2];
            }
        }

        return { organization, repository, number };
    }

    // --- Issue event link ---

    function addLinkToIssueEvent(issue, baseURL) {
        console.log("[Jira Links] Adding a link to issue events");
        const phActionsDiv = document.querySelector('div[data-component="PH_Actions"]');
        if (phActionsDiv !== null) {
            const innerDiv = phActionsDiv.querySelector('div');
            if (innerDiv) {
                // Avoid adding duplicate links
                if (innerDiv.querySelector('a[title*="issue events"]')) return;
                const link = document.createElement('a');
                link.textContent = '🕰️';
                link.href = baseURL + "/" + issue.organization + "/" + issue.repository + "/txt/" + issue.number + ".txt";
                link.target = '_blank';
                link.title = "Display issue events (⚠️ VPN REQUIRED ⚠️)";
                innerDiv.appendChild(link);
            }
        } else {
            console.log("[Jira Links] Unable to find the issue actions to add the icon to");
        }
    }

    // --- Main logic ---

    function collectTicketsFromIssueView() {
        const projects = findAllProjectsInSidebar();
        for (const project of projects) {
            expandProject(project);
        }

        setTimeout(() => {
            const allTicketIds = [];
            for (const project of projects) {
                const content = getTicketsFieldFromProject(project);
                const ids = getTicketIds(content);
                if (ids.length > 0) allTicketIds.push(...ids);
            }
            const uniqueTicketIds = [...new Set(allTicketIds)];
            if (uniqueTicketIds.length > 0) {
                const container = findTargetContainer();
                createJiraSection(uniqueTicketIds, cfgJiraBaseURL, container);
            }
        }, 1000);
    }

    function collectTicketsFromProjectPane() {
        // In project pane, fields may already be visible without expanding
        const content = getTicketsFromProjectPane();
        const ids = getTicketIds(content);
        if (ids.length > 0) {
            const container = findTargetContainer();
            createJiraSection(ids, cfgJiraBaseURL, container);
        } else {
            // Retry: the pane content may still be loading
            setTimeout(() => {
                const retryContent = getTicketsFromProjectPane();
                const retryIds = getTicketIds(retryContent);
                if (retryIds.length > 0) {
                    const container = findTargetContainer();
                    createJiraSection(retryIds, cfgJiraBaseURL, container);
                }
            }, 1500);
        }
    }

    function init() {
        console.log("[Jira Links] Initializing for URL:", window.location.href);
        removeExistingJiraSection();

        const issue = getIssueObject(window.location.href);
        console.log("[Jira Links] Issue:", issue);

        // Add issue event history link (for Jahia org only)
        if (issue.organization === "Jahia" && issue.number) {
            addLinkToIssueEvent(issue, cfgIssueEventsBaseURL);
        }

        if (isIssueView()) {
            collectTicketsFromIssueView();
        } else if (isProjectPaneView()) {
            collectTicketsFromProjectPane();
        }
    }

    // --- SPA navigation handling ---
    // Project views use pushState/replaceState for navigation without full page reloads.

    let lastUrl = window.location.href;

    function onUrlChange() {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            console.log("[Jira Links] URL changed, re-initializing");
            // Wait for the new pane content to render
            setTimeout(init, 1500);
        }
    }

    // Intercept pushState and replaceState to detect SPA navigation
    const originalPushState = history.pushState;
    history.pushState = function () {
        originalPushState.apply(this, arguments);
        onUrlChange();
    };

    const originalReplaceState = history.replaceState;
    history.replaceState = function () {
        originalReplaceState.apply(this, arguments);
        onUrlChange();
    };

    window.addEventListener('popstate', onUrlChange);

    // Run on initial page load
    window.addEventListener('load', () => {
        setTimeout(init, 2000);
    });

    // Also observe DOM changes for dynamic pane loading (e.g., clicking an issue in project view)
    const observer = new MutationObserver(() => {
        onUrlChange();
    });
    observer.observe(document.querySelector('head > title') || document.head, {
        childList: true,
        subtree: true,
        characterData: true
    });
})();
