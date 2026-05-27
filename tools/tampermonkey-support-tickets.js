// ==UserScript==
// @name         GitHub Issue Jira Links
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Add clickable Jira ticket links from the "Jira tickets" issue field. Works in both issue pages and project board pane views.
// @author       Fgerthoffert
// @match        https://github.com/*/*/issues/*
// @match        https://github.com/*/*/projects/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const cfgJiraBaseURL = 'https://support.jahia.com/browse/';
    const cfgIssueEventsBaseURL = 'https://zencrepes.jahia.com/zindex/';
    const JIRA_SECTION_ID = 'tampermonkey-jira-links';

    // --- DOM helpers ---

    function removeExistingJiraSection() {
        const existing = document.getElementById(JIRA_SECTION_ID);
        if (existing) existing.remove();
    }

    // --- Issue field extraction ---

    function getTicketsFromIssueField() {
        // Look for the "Jira tickets" field button via its aria-label
        const fieldButton = document.querySelector('button[aria-label="Edit Jira tickets"]');
        if (!fieldButton) {
            console.log("[Jira Links] No 'Jira tickets' issue field found");
            return undefined;
        }
        // The value is in the second span (the one with the value text class)
        const valueSpan = fieldButton.querySelector('span[class*="issueFieldValueText"]');
        if (!valueSpan) {
            console.log("[Jira Links] 'Jira tickets' field has no value span");
            return undefined;
        }
        const text = valueSpan.textContent.trim();
        if (!text || text === 'None yet') {
            console.log("[Jira Links] 'Jira tickets' field is empty");
            return undefined;
        }
        console.log("[Jira Links] Found tickets field value: " + text);
        return text;
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

        // Fallback: issue body
        const issueBody = document.querySelector('[data-testid="issue-body"]');
        if (issueBody) return issueBody.parentElement;

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

    function collectTicketsFromField(retries = 2) {
        const content = getTicketsFromIssueField();
        const ticketIds = getTicketIds(content);
        if (ticketIds.length > 0) {
            const container = findTargetContainer();
            if (!container && retries > 0) {
                console.log("[Jira Links] Target container not found, retrying...");
                setTimeout(() => collectTicketsFromField(retries - 1), 1000);
                return;
            }
            createJiraSection(ticketIds, cfgJiraBaseURL, container);
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

        // Read Jira tickets directly from the issue field
        collectTicketsFromField();
    }

    // --- SPA navigation handling ---
    // Project views use pushState/replaceState for navigation without full page reloads.

    let lastUrl = window.location.href;
    let pendingInitTimeout = null;

    function onUrlChange() {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            console.log("[Jira Links] URL changed, re-initializing");
            // Debounce to avoid duplicate init() calls from rapid mutations
            clearTimeout(pendingInitTimeout);
            pendingInitTimeout = setTimeout(init, 1500);
        }
    }

    // Intercept pushState and replaceState to detect SPA navigation
    const originalPushState = history.pushState;
    history.pushState = function () {
        originalPushState.apply(this, arguments);
        try { onUrlChange(); } catch (e) { console.error("[Jira Links]", e); }
    };

    const originalReplaceState = history.replaceState;
    history.replaceState = function () {
        originalReplaceState.apply(this, arguments);
        try { onUrlChange(); } catch (e) { console.error("[Jira Links]", e); }
    };

    window.addEventListener('popstate', onUrlChange);

    // Run on initial page load (handle case where load already fired)
    if (document.readyState === 'complete') {
        setTimeout(init, 500);
    } else {
        window.addEventListener('load', () => {
            setTimeout(init, 2000);
        });
    }

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
