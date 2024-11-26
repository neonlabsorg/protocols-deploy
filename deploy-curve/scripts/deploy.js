async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    // Deploy the blueprint contract
    const BlueprintFactory = await ethers.getContractFactory("CurveStableSwapNG", [
        "blueprint",
        "BLUEPRINT",
        500,
        1000000,
        50000000000,
        866,
        '0x0000000000000000000000000000000000000000',
        "0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4",
        ["0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4"],
        [
            "0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4",
            "0x493257fD37EDB34451f62EDf8D2a0C418852bA4C",
        ],
        [10**18],
        [0],
        ["0x00000000"],
        ['0x0000000000000000000000000000000000000000']
    ]);

    const blueprint = await BlueprintFactory.deploy();
    await blueprint.waitForDeployment();

    console.log("Blueprint contract deployed at:", blueprint.target);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
