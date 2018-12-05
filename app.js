#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(1);
checkArguments(args);

var currentDirectory = getArgument("--dir", "-d", __dirname);
var verbose = getArgument("--verbose", "-v", false);

var replacementFile = getArgument("--replacements", "-r", null);
var replacements = []
if (replacementFile !== null) {
	var replacementJson = fs.readFileSync(replacementFile);
	replacements = JSON.parse(replacementJson);
}

forEachFileInDirectory( currentDirectory, function(filePath, relativeDirectory){
	if (filePath.endsWith('.md')) {
		if (verbose) {
			console.log("Applying fixes to " + filePath);
		}
		updateBearFile(filePath, relativeDirectory);
	}
});

function checkArguments() {
	if (getArgument("--help", "-h", false)) {
		printUseage();
		process.exit( 0 );
	}
}

function getArgument(fullName, shortName, defaultResult) {
	var index = args.indexOf(fullName)
	if ( index === -1 ) {
		index = args.indexOf(shortName)
	}
	if ( index === -1 ) {
		return defaultResult;
	}

	if (defaultResult !== false) {
		return args[index+1]
	} else {
		return true
	}
}

function printUseage() {
	console.log("Usage: bear-md-to-github-wiki [options]\n");
	console.log("Options:");
	console.log("  -d, --dir            Directory containing the markdown files to parse");
	console.log("  -r, --replacements   Provide a file containing replacements to make");
	console.log("  -h, --help           Output this help prompt");
	console.log("  -v, --verbose        Log information");
	console.log("\nThis should be executed from the root of your github wiki project");
}

function forEachFileInDirectory( directoryPath, callback ) {

	// Loop through all the files in the directory
	fs.readdir( directoryPath, function( err, files ) {
		if (err) {
			console.error( "Could not list the directory.", err );
			process.exit( 1 );
		} 

		files.forEach( function( file, index ) {
			// Make one pass and make the file complete
			var filePath = path.join( directoryPath, file );

			fs.stat( filePath, function( error, stat ) {
				if (error) {
					console.error("Error stating file.", error);
					return;
				}

				if (stat.isFile()) {
					callback( filePath, directoryPath );
				} else if (stat.isDirectory()) {
					forEachFileInDirectory( filePath, callback );
				}
			});
		});
	})
}

function updateBearFile(filePath, relativeDirectory) {
	var fullString = fs.readFileSync(filePath).toString();

	var stringAndCodeSnippets = removeCodeSnippets(fullString);
	var string = stringAndCodeSnippets.string;
	var codeSnippets = stringAndCodeSnippets.snippets;

	// Remove title
	if ( string.startsWith('# ') ) {
		string = string.replace(/(.*)# [^\n]*\n(.*)/, "$1$2");
	}

	for (var i = 0; i < replacements.length; i++) {
		var search = replacements[i].search;
		var replacement = replacements[i].replacement;
		string = string.replace(search, replacement);
	}

	// Fix Image Links
	if ( relativeDirectory !== __dirname ) {

		// Remove previously fixed images to prevent adding the directory multiple times
		var removeDirectoryRegex = new RegExp("!\\[\\]\\(" + relativeDirectory + "\\/(.*)\\)", "gm");
		string = string.replace(removeDirectoryRegex, "![]($1)");

		string = string.replace(/!\[\]\((.*)\)/gm, "![](" + relativeDirectory + "/$1)");
	}

	// Fix Single Line Breaks
	// We repeat this a few times as the regex can overlap multiple occurrences missing some
	for (var i = 0; i < 3; i++) {
		string = string.replace(/(\n[^\n#]*[a-zA-Z\.])(\n[a-zA-Z])/gm, "$1<br>$2")
	}

	string = reInsertCodeSnippets(string, codeSnippets);

	fs.writeFileSync(filePath, string);	
}

function removeCodeSnippets(string) {
	var lines = string.split("\n");
	var inCodeSnippet = false;

	var resultString = "";
	var resultSnippets = [];
	var currentSnippet = "";
	var currentSnippetIndex = 0;

	for (var i = 0; i < lines.length; i++) {
		let line = lines[i];

		if (line.startsWith("```")) {
			inCodeSnippet = !inCodeSnippet;
			if (!inCodeSnippet) {
				currentSnippet += line;
				resultSnippets.push(currentSnippet);
				resultString += "```" + currentSnippetIndex + "```\n";
				currentSnippetIndex++;
			} else {
				currentSnippet = line + "\n";
			}
			continue;
		}

		if (inCodeSnippet) {
			currentSnippet += line + "\n";
		} else {
			resultString += line + "\n";
		}
	}

	// Remove extra linespace
	resultString = resultString.slice(0, -1);

	return {
		string: resultString,
		snippets: resultSnippets
	};
}

function reInsertCodeSnippets(string, snippets) {
	for (var i = snippets.length - 1; i >= 0; i--) {
		var placeholder = "```" + i + "```";
		var snippet = snippets[i];
		string = string.replace(placeholder, snippet);
	}
	return string;
}