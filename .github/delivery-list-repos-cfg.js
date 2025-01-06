// This file contains the json2csv transformation config to create a CSV
// See: https://juanjodiaz.github.io/json2csv/#/parsers/cli
export default {
    fields: [
      {
        label: '',
        value: row => {
          return ' - ' + row.nameWithOwner + '@' + row.defaultBranchRef.name
        }
      }
    ]
  }