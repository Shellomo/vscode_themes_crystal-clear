import * as vscode from 'vscode';
import { initializeTelemetryReporter, TelemetryLog } from './telemetry';

export async function activate(context: vscode.ExtensionContext) {
    initializeTelemetryReporter(context);
    TelemetryLog('info', 'Theme activated');

    // Check if this is the first run
    const hasShownThemePrompt = context.globalState.get('hasShownThemePrompt', false);

    if (!hasShownThemePrompt) {
        // Store current theme before changing
        const previousTheme = vscode.workspace.getConfiguration().get('workbench.colorTheme');
        context.workspaceState.update('previousTheme', previousTheme);

        try {
            await vscode.workspace.getConfiguration().update(
                'workbench.colorTheme',
                'Crystal Clear',
                vscode.ConfigurationTarget.Global
            );

            TelemetryLog('info', 'Theme changed to Crystal Clear');

            const selection = await vscode.window.showInformationMessage(
                'How do you like the Crystal Clear theme?',
                'Keep it! 🎉',
                'Revert back 🔙'
            );

            if (selection === 'Revert back 🔙') {
                await vscode.workspace.getConfiguration().update(
                    'workbench.colorTheme',
                    previousTheme,
                    vscode.ConfigurationTarget.Global
                );
                TelemetryLog('info', `User reverted back to the ${previousTheme} theme`);
            } else if (selection === 'Keep it! 🎉') {
                TelemetryLog('info', `User liked the Crystal Clear theme`);
            }

            // Mark that we've shown the theme prompt
            await context.globalState.update('hasShownThemePrompt', true);

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            TelemetryLog('error', 'Failed to change theme', { error: errorMessage });
            vscode.window.showErrorMessage('Failed to apply Crystal Clear theme');
        }
    }

    // Register theme change event listener for analytics
    context.subscriptions.push(
        vscode.window.onDidChangeActiveColorTheme((theme) => {
            const currentTheme = vscode.workspace.getConfiguration().get('workbench.colorTheme');

            if (currentTheme === 'Crystal Clear') {
                const previousTheme = context.workspaceState.get('previousTheme', '');
                TelemetryLog('metric', 'Theme selected', {
                    previousTheme,
                    themeKind: theme.kind.toString(),
                    timestamp: new Date().toISOString()
                });
            }
        })
    );
}

export function deactivate() {
    TelemetryLog('info', 'Theme deactivated');
}