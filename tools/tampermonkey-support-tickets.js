// ==UserScript==
// @name         GitHub Issue Jira Links
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Add a section below the GitHub issue description with Jira tickets listed from the "Support tickets" field.
// @author       Fgerthoffert
// @match        https://github.com/*/*/issues/*
// @match        https://github.com/*/*/projects/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const cfgJiraBaseURL = 'https://support.jahia.com/browse/'; // Update with your Jira instance URL.
    const cfgProjectName = 'Customers'
    const cfgTicketsFieldName = 'Jira tickets'

    function findProject(projectName) {
        const projectsSidebar = document.querySelector('[data-testid="sidebar-projects-section"]');
        const projectEntries = Array.from(projectsSidebar.querySelector('div:nth-child(2) > div').children);
        let foundProject;
        for (const project of projectEntries) {
          if (project.textContent.includes(projectName)) {
            console.log("Project: " + projectName + " found")
            foundProject = project
          }
        }
        return foundProject
    }

    function expandProject(project) {
        if (project !== undefined) {
            // Not clicking if the field is already visible
            if (!project.textContent.includes(cfgTicketsFieldName)) {
                const expandButton = project.querySelector('[aria-label="Show more project fields"]');
                if (expandButton) {
                    console.log("Clicking on expand button")
                    expandButton.click();
                }
            }
        }
    }


   function getTicketsFieldContent(project, ticketsFieldName) {
       let ticketsField;
       let fieldContent;
       const projectFieldsEntries = Array.from(project.querySelector('div > ul > div > div').children);
       for (const projectField of projectFieldsEntries) {
           if (projectField.textContent.includes(ticketsFieldName)) {
               console.log("Field: " + ticketsFieldName + " found in project")
               ticketsField = projectField
           }
       }

       if (ticketsField !== undefined) {
           fieldContent = ticketsField.querySelector('li > button').textContent
       }
       return fieldContent
   }

    function getTicketIds(ticketsFieldContent) {
        return ticketsFieldContent
            .trim()
            .split(',')
            .map(ticket => ticket.trim());
    }

    function createJiraSection(ticketIDs, jiraBaseURL) {
        console.log("Creating links for tickets: ", ticketIDs)
        const jiraSection = document.createElement('div');
        jiraSection.style.marginTop = '20px';

        jiraSection.innerHTML = `
          <div style="display: flex; align-items: center; gap: 10px; font-size: 14px;">
              <span style="font-size: 12px; font-weight: bold;">Support Tickets:</span>
              <div style="display: flex; flex-wrap: nowrap; gap: 10px; overflow-x: auto;">
                  ${ticketIDs
                    .map(ticketID => `<span style="background-color: #f1f8ff; padding: 5px 10px; border-radius: 5px; white-space: nowrap; font-size: 12px;"><a href="${jiraBaseURL}${ticketID}" target="_blank" style="text-decoration: none; color: #0366d6;">${ticketID}</a></span>`)
                    .join('')}
              </div>
          </div>
      `;

        // Find the description container and append the new section below it.
        const descriptionContainer = document.querySelector('[data-testid="issue-viewer-issue-container"]');
        if (descriptionContainer) {
            descriptionContainer.appendChild(jiraSection);
        }
    }

    function init() {
        // Expand project details first, then extract and display tickets.
        const project = findProject(cfgProjectName)
        expandProject(project)

        setTimeout(() => {
            const ticketsFieldContent = getTicketsFieldContent(project, cfgTicketsFieldName)
            const ticketIds = getTicketIds(ticketsFieldContent)
            if (ticketIds && ticketIds.length > 0) {
                createJiraSection(ticketIds, cfgJiraBaseURL);
            }
        }, 1000); // Delay to ensure the expanded content is loaded.
    }

    // Run the script after the page loads completely.
    window.addEventListener('load', () => {
        setTimeout(init, 2000); // Allow time for dynamic GitHub content to load.
    });
})();
