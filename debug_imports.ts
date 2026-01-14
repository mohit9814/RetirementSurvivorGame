
async function testImport(name: string, path: string) {
    try {
        console.log(`Importing ${name}...`);
        await import(path);
        console.log(`✅ ${name} imported successfully.`);
    } catch (e) {
        console.error(`❌ ${name} FAILED to import:`);
        console.error(e);
    }
}

async function run() {
    await testImport('types', './src/types/index.ts');
    await testImport('MarketEngine', './src/engine/MarketEngine.ts');
    await testImport('GameEngine', './src/engine/GameEngine.ts');
    await testImport('useGame', './src/hooks/useGame.ts');

    // React components often require DOM, so they might fail in Node if they access window/document at top level.
    // But usually components are pure functions at top level.
    // Note: .tsx extensions need to be handled by tsx runner.
    await testImport('BucketCard', './src/components/BucketCard.tsx');
    await testImport('ControlPanel', './src/components/ControlPanel.tsx');
    await testImport('SetupForm', './src/components/SetupForm.tsx');
}

run();
