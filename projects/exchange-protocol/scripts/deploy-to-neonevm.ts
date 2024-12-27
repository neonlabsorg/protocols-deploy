import { ethers, network, run } from "hardhat";
import config from "../config";

const main = async () => {
  await run("compile");
  console.log("Compiled contracts.");

  const networkName = network.name;
  console.log("Network name: ", networkName);

  if (!process.env.DEPLOYER_PRIVATE_KEY) {
    throw new Error("Missing private key: DEPLOYER_PRIVATE_KEY");
  }

  if (!config.WNEON[networkName] || config.WNEON[networkName] === ethers.constants.AddressZero) {
    throw new Error("Missing wNEON address");
  }

  const deployer = (await ethers.getSigners())[0];
  console.log("Deployer account: ", deployer.address);

  console.log("Deploying PancakeFactory...");

  const PancakeFactory = await ethers.getContractFactory("PancakeFactory");

  const pancakeFactory = await PancakeFactory.deploy(
    deployer.address
  );

  await pancakeFactory.deployed();

  console.log("PancakeFactory deployed to:", pancakeFactory.address);

  console.log("Deploying PancakeRouter01...");

  const PancakeRouter01 = await ethers.getContractFactory("PancakeRouter01");

  const pancakeRouter = await PancakeRouter01.deploy(
    pancakeFactory.address,
    config.WNEON[networkName]
  );

  await pancakeRouter.deployed();

  console.log("PancakeRouter01 deployed to:", pancakeRouter.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
