# Bear Markdown to GitHub wiki

Simple node script to apply fixes to markdown files exported from the Bear notes app, to make them work better in GitHub wiki's.

This let's me write documentation using the Bear notes app, and easily publish it on GitHub Wiki's.

## Fixes it applies

1. It removes the heading (as this is taken from the filename in a GitHub wiki page).
2. Applies arbitrary replacements from a replacements json file
3. Corrects image links if the files and images are in a directory
4. Corrected single line breaks by adding `<br>`
5. Protects multi-line code snippets from modification

## Replacements

You can optionally provide a replacements file. This is important if you have links between Bear notes.

The replacements file should be in this format:

```json
[
	{ "search": "#debate-mate/documentation\n", "replacement": "" },
	{ "search": "#debate-mate/documentation", "replacement": "" },
	{ "search": "(bear://x-callback-url/open-note?id=36F58230-32C5-43AE-B8E8-7FFF5FF92093-46968-0001EEBE453317DF)",
	  "replacement": "(Post-Types)" },
	{ "search": "(bear://x-callback-url/open-note?id=1E3FBAF2-99D9-469B-A115-C72A557C63DD-46968-000206E830818BBC)",
	  "replacement": "(User-Accounts)" }
]
```

In the above example I'm removing a tag which is common in all of the documents I've exported, and I'm replacing a couple of links between Bear notes to be GitHub wiki links.

**Note:** The replacements occur from top to bottom.

## Usage

```
Usage: bear-md-to-github-wiki [options]

Options:
  -d, --dir            Directory containing the markdown files to parse
  -r, --replacements   Provide a file containing replacements to make
  -h, --help           Output this help prompt
  -v, --verbose        Log information

This should be executed from the root of your github wiki project
```