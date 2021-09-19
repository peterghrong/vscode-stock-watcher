import * as vscode from 'vscode';

/**
 * Typing for returned quote data
 */
type QuoteData = {
	c: number;
	d: number | null;
	dp: number | null;
	h: number;
	l: number;
	o: number;
	pc: number;
};

const stocks: vscode.StatusBarItem[] = [];

export function activate({ subscriptions }: vscode.ExtensionContext) {

	// preset configurations
	const refreshInterval: number = 60000;

	// initial refresh on loading
	refresh();

	// after initial loading to get up to date time every minute
	setInterval(function () {
		let shouldRefresh: boolean = false;
		const currentTime = new Date(
			new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
		);
		const hour: number = currentTime.getHours();
		const day: number = currentTime.getDay();
		if (day > 1 && day < 6) {
			if (hour > 4 && hour < 20) {
				shouldRefresh = true;
			}
		}
		if (shouldRefresh === true) {
			refresh();
		}
	}, refreshInterval);

	// watcher for context changes
	subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(refresh),
	);
}

/**
 * @param apiKey 
 * @returns finnhub api client for queries, untyped
 */
function finnhubClient(apiKey: string) {
	const finnhub = require('finnhub');
	const finnhubApiKey = finnhub.ApiClient.instance.authentications['api_key'];
	finnhubApiKey.apiKey = apiKey;
	const finnhubClient = new finnhub.DefaultApi();
	return finnhubClient;
}

function selectColor(dp: number): string {
	const colors: string[] = [
		'#fd6e70', // NASDAQ Red
		'#6cb33f', // NASDAQ Green
		'white', // unchanged
	];
	if (dp > 0) {
		return colors[1];
	}
	else if (dp < 0) {
		return colors[0];
	}
	else {
		return colors[2];
	}
}

function refresh(): void {
	const config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration();
	const stockSymbols: string[] = config.get('vscode-stock-watcher.stockSymbols', []);
	const apiKey: string[] = config.get('vscode-stock-watcher.FinnhubApiKey', []);

	if (apiKey.length !== 0) {
		cleanUp();
		const finnhub: any = finnhubClient(apiKey[0]);
		stockSymbols.forEach((stockSymbol) => {
			let symbol: vscode.StatusBarItem = vscode.window.createStatusBarItem();
			let name: string = stockSymbol.toUpperCase();
			let quote = finnhub.quote(name, (error: any, data: QuoteData, response: any) => {
				if (data.dp !== null) {
					symbol.text = `${name}: ${data.c}`;
					symbol.color = selectColor(data.dp);
					symbol.show();
					stocks.push(symbol);
				}
			});
		});
		return;
	}
}

function cleanUp(): void {
	stocks.forEach((symbol) => {
		symbol.hide();
		symbol.dispose();
	});
}

export function deactivate() { }