import { FakeContract, MockContract, smock } from "@defi-wonderland/smock";
import { loadFixture, mineUpTo } from "@nomicfoundation/hardhat-network-helpers";
import chai from "chai";
import { BigNumber, Signer } from "ethers";
import { ethers } from "hardhat";

import { BSC_BLOCKS_PER_YEAR } from "../../../helpers/deploymentConfig";
import { convertToUnit } from "../../../helpers/utils";
import { Comptroller, MockToken, PoolLens, PoolLens__factory, RewardsDistributor, VToken } from "../../../typechain";
import { getDescription } from "../util/descriptionHelpers";

const { expect } = chai;
chai.use(smock.matchers);

// Disable a warning about mixing beacons and transparent proxies
upgrades.silenceWarnings();

let comptroller: FakeContract<Comptroller>;
let vBUSD: FakeContract<VToken>;
let vWBTC: FakeContract<VToken>;
let rewardDistributor1: FakeContract<RewardsDistributor>;
let rewardToken1: FakeContract<MockToken>;
let rewardDistributor2: FakeContract<RewardsDistributor>;
let rewardToken2: FakeContract<MockToken>;
let rewardDistributor3: FakeContract<RewardsDistributor>;
let rewardToken3: FakeContract<MockToken>;
let poolLens: MockContract<PoolLens>;
let account: Signer;
let startBlock: number;
let isTimeBased = false; // for block based contracts
let blocksPerYear = BSC_BLOCKS_PER_YEAR; // for block based contracts

type RewardsFixtire = {
  comptroller: FakeContract<Comptroller>;
  vBUSD: FakeContract<VToken>;
  vWBTC: FakeContract<VToken>;
  rewardDistributor1: FakeContract<RewardsDistributor>;
  rewardToken1: FakeContract<MockToken>;
  rewardDistributor2: FakeContract<RewardsDistributor>;
  rewardToken2: FakeContract<MockToken>;
  rewardDistributor3: FakeContract<RewardsDistributor>;
  rewardToken3: FakeContract<MockToken>;
  poolLens: MockContract<PoolLens>;
  startBlock: number;
};

const rewardsFixture = async (): Promise<RewardsFixtire> => {
  comptroller = await smock.fake<Comptroller>("Comptroller");
  vBUSD = await smock.fake<VToken>("VToken");
  vWBTC = await smock.fake<VToken>("VToken");
  rewardDistributor1 = await smock.fake<RewardsDistributor>("RewardsDistributor");
  rewardDistributor2 = await smock.fake<RewardsDistributor>("RewardsDistributor");
  rewardDistributor3 = await smock.fake<RewardsDistributor>("RewardsDistributor");
  rewardToken1 = await smock.fake<MockToken>("MockToken");
  rewardToken2 = await smock.fake<MockToken>("MockToken");
  rewardToken3 = await smock.fake<MockToken>("MockToken");
  const poolLensFactory = await smock.mock<PoolLens__factory>("PoolLens");
  poolLens = await poolLensFactory.deploy(isTimeBased, blocksPerYear);

  const startBlock = await ethers.provider.getBlockNumber();

  // Fake return values
  comptroller.getAllMarkets.returns([vBUSD.address, vWBTC.address]);
  comptroller.getRewardDistributors.returns([
    rewardDistributor1.address,
    rewardDistributor2.address,
    rewardDistributor3.address,
  ]);

  rewardDistributor1.isTimeBased.returns(false);
  rewardDistributor1.rewardToken.returns(rewardToken1.address);
  rewardDistributor1.rewardTokenBorrowerIndex.returns(convertToUnit(1, 18));
  rewardDistributor1.rewardTokenSupplierIndex.returns(convertToUnit(1, 18));
  rewardDistributor1.rewardTokenAccrued.returns(convertToUnit(50, 18));
  rewardDistributor1.rewardTokenSupplySpeeds.whenCalledWith(vBUSD.address).returns(convertToUnit(0.5, 18));
  rewardDistributor1.rewardTokenSupplySpeeds.whenCalledWith(vWBTC.address).returns(convertToUnit(0.5, 18));
  rewardDistributor1.rewardTokenBorrowSpeeds.whenCalledWith(vBUSD.address).returns(convertToUnit(0.5, 18));
  rewardDistributor1.rewardTokenBorrowSpeeds.whenCalledWith(vWBTC.address).returns(convertToUnit(0.5, 18));
  rewardDistributor1.rewardTokenBorrowState.returns({
    index: convertToUnit(1, 18),
    block: startBlock,
    lastRewardingBlock: 0,
  });
  rewardDistributor1.rewardTokenSupplyState.returns({
    index: convertToUnit(1, 18),
    block: startBlock,
    lastRewardingBlock: 0,
  });

  rewardDistributor2.isTimeBased.returns(false);
  rewardDistributor2.rewardToken.returns(rewardToken2.address);
  rewardDistributor2.rewardTokenBorrowerIndex.returns(convertToUnit(1, 18));
  rewardDistributor2.rewardTokenSupplierIndex.returns(convertToUnit(1, 18));
  rewardDistributor2.rewardTokenAccrued.returns(convertToUnit(50, 18));
  rewardDistributor2.rewardTokenSupplySpeeds.whenCalledWith(vBUSD.address).returns(convertToUnit(0.5, 18));
  rewardDistributor2.rewardTokenSupplySpeeds.whenCalledWith(vWBTC.address).returns(convertToUnit(0.5, 18));
  rewardDistributor2.rewardTokenBorrowSpeeds.whenCalledWith(vBUSD.address).returns(convertToUnit(0.5, 18));
  rewardDistributor2.rewardTokenBorrowSpeeds.whenCalledWith(vWBTC.address).returns(convertToUnit(0.5, 18));
  rewardDistributor2.rewardTokenBorrowState.returns({
    index: convertToUnit(1, 18),
    block: startBlock,
    lastRewardingBlock: 0,
  });
  rewardDistributor2.rewardTokenSupplyState.returns({
    index: convertToUnit(1, 18),
    block: startBlock,
    lastRewardingBlock: 0,
  });

  rewardDistributor3.isTimeBased.returns(false);
  rewardDistributor3.rewardToken.returns(rewardToken3.address);
  rewardDistributor3.rewardTokenBorrowerIndex.returns(convertToUnit(1, 18));
  rewardDistributor3.rewardTokenSupplierIndex.returns(convertToUnit(1, 18));
  rewardDistributor3.rewardTokenAccrued.returns(convertToUnit(50, 18));
  rewardDistributor3.rewardTokenSupplySpeeds.whenCalledWith(vBUSD.address).returns(convertToUnit(0.5, 18));
  rewardDistributor3.rewardTokenSupplySpeeds.whenCalledWith(vWBTC.address).returns(convertToUnit(0.5, 18));
  rewardDistributor3.rewardTokenBorrowSpeeds.whenCalledWith(vBUSD.address).returns(convertToUnit(0.5, 18));
  rewardDistributor3.rewardTokenBorrowSpeeds.whenCalledWith(vWBTC.address).returns(convertToUnit(0.5, 18));
  rewardDistributor3.rewardTokenBorrowState.returns({
    index: convertToUnit(1, 18),
    block: startBlock,
    lastRewardingBlock: 0,
  });
  rewardDistributor3.rewardTokenSupplyState.returns({
    index: convertToUnit(1, 18),
    block: startBlock,
    lastRewardingBlock: 0,
  });

  vBUSD.borrowIndex.returns(convertToUnit(1, 18));
  vBUSD.totalBorrows.returns(convertToUnit(10000, 8));
  vBUSD.totalSupply.returns(convertToUnit(10000, 8));
  vBUSD.balanceOf.returns(convertToUnit(100, 8));
  vBUSD.borrowBalanceStored.returns(convertToUnit(100, 8));

  vWBTC.borrowIndex.returns(convertToUnit(1, 18));
  vWBTC.totalBorrows.returns(convertToUnit(100, 18));
  vWBTC.totalSupply.returns(convertToUnit(100, 18));
  vWBTC.balanceOf.returns(convertToUnit(100, 8));
  vWBTC.borrowBalanceStored.returns(convertToUnit(100, 8));

  return {
    comptroller,
    vBUSD,
    vWBTC,
    rewardDistributor1,
    rewardToken1,
    rewardDistributor2,
    rewardToken2,
    rewardDistributor3,
    rewardToken3,
    poolLens,
    startBlock,
  };
};

const timeBasedRewardsFixture = async (): Promise<RewardsFixtire> => {
  comptroller = await smock.fake<Comptroller>("Comptroller");
  vBUSD = await smock.fake<VToken>("VToken");
  vWBTC = await smock.fake<VToken>("VToken");
  rewardDistributor1 = await smock.fake<RewardsDistributor>("RewardsDistributor");
  rewardDistributor2 = await smock.fake<RewardsDistributor>("RewardsDistributor");
  rewardDistributor3 = await smock.fake<RewardsDistributor>("RewardsDistributor");
  rewardToken1 = await smock.fake<MockToken>("MockToken");
  rewardToken2 = await smock.fake<MockToken>("MockToken");
  rewardToken3 = await smock.fake<MockToken>("MockToken");
  const poolLensFactory = await smock.mock<PoolLens__factory>("PoolLens");

  isTimeBased = true;
  blocksPerYear = 0;
  poolLens = await poolLensFactory.deploy(isTimeBased, blocksPerYear);

  const startBlock = (await ethers.provider.getBlock("latest")).number;
  const startBlockTimestamp = (await ethers.provider.getBlock("latest")).timestamp;

  // Fake return values
  comptroller.getAllMarkets.returns([vBUSD.address, vWBTC.address]);
  comptroller.getRewardDistributors.returns([
    rewardDistributor1.address,
    rewardDistributor2.address,
    rewardDistributor3.address,
  ]);

  rewardDistributor1.isTimeBased.returns(true);
  rewardDistributor1.rewardToken.returns(rewardToken1.address);
  rewardDistributor1.rewardTokenBorrowerIndex.returns(convertToUnit(1, 18));
  rewardDistributor1.rewardTokenSupplierIndex.returns(convertToUnit(1, 18));
  rewardDistributor1.rewardTokenAccrued.returns(convertToUnit(50, 18));
  rewardDistributor1.rewardTokenSupplySpeeds.whenCalledWith(vBUSD.address).returns(convertToUnit(0.5, 18));
  rewardDistributor1.rewardTokenSupplySpeeds.whenCalledWith(vWBTC.address).returns(convertToUnit(0.5, 18));
  rewardDistributor1.rewardTokenBorrowSpeeds.whenCalledWith(vBUSD.address).returns(convertToUnit(0.5, 18));
  rewardDistributor1.rewardTokenBorrowSpeeds.whenCalledWith(vWBTC.address).returns(convertToUnit(0.5, 18));
  rewardDistributor1.rewardTokenBorrowStateTimeBased.returns({
    index: convertToUnit(1, 18),
    timestamp: startBlockTimestamp,
    lastRewardingTimestamp: 0,
  });
  rewardDistributor1.rewardTokenSupplyStateTimeBased.returns({
    index: convertToUnit(1, 18),
    timestamp: startBlockTimestamp,
    lastRewardingTimestamp: 0,
  });

  rewardDistributor2.isTimeBased.returns(true);
  rewardDistributor2.rewardToken.returns(rewardToken2.address);
  rewardDistributor2.rewardTokenBorrowerIndex.returns(convertToUnit(1, 18));
  rewardDistributor2.rewardTokenSupplierIndex.returns(convertToUnit(1, 18));
  rewardDistributor2.rewardTokenAccrued.returns(convertToUnit(50, 18));
  rewardDistributor2.rewardTokenSupplySpeeds.whenCalledWith(vBUSD.address).returns(convertToUnit(0.5, 18));
  rewardDistributor2.rewardTokenSupplySpeeds.whenCalledWith(vWBTC.address).returns(convertToUnit(0.5, 18));
  rewardDistributor2.rewardTokenBorrowSpeeds.whenCalledWith(vBUSD.address).returns(convertToUnit(0.5, 18));
  rewardDistributor2.rewardTokenBorrowSpeeds.whenCalledWith(vWBTC.address).returns(convertToUnit(0.5, 18));
  rewardDistributor2.rewardTokenBorrowStateTimeBased.returns({
    index: convertToUnit(1, 18),
    timestamp: startBlockTimestamp,
    lastRewardingTimestamp: 0,
  });
  rewardDistributor2.rewardTokenSupplyStateTimeBased.returns({
    index: convertToUnit(1, 18),
    timestamp: startBlockTimestamp,
    lastRewardingTimestamp: 0,
  });

  rewardDistributor3.isTimeBased.returns(true);
  rewardDistributor3.rewardToken.returns(rewardToken3.address);
  rewardDistributor3.rewardTokenBorrowerIndex.returns(convertToUnit(1, 18));
  rewardDistributor3.rewardTokenSupplierIndex.returns(convertToUnit(1, 18));
  rewardDistributor3.rewardTokenAccrued.returns(convertToUnit(50, 18));
  rewardDistributor3.rewardTokenSupplySpeeds.whenCalledWith(vBUSD.address).returns(convertToUnit(0.5, 18));
  rewardDistributor3.rewardTokenSupplySpeeds.whenCalledWith(vWBTC.address).returns(convertToUnit(0.5, 18));
  rewardDistributor3.rewardTokenBorrowSpeeds.whenCalledWith(vBUSD.address).returns(convertToUnit(0.5, 18));
  rewardDistributor3.rewardTokenBorrowSpeeds.whenCalledWith(vWBTC.address).returns(convertToUnit(0.5, 18));
  rewardDistributor3.rewardTokenBorrowStateTimeBased.returns({
    index: convertToUnit(1, 18),
    timestamp: startBlockTimestamp,
    lastRewardingTimestamp: 0,
  });
  rewardDistributor3.rewardTokenSupplyStateTimeBased.returns({
    index: convertToUnit(1, 18),
    timestamp: startBlockTimestamp,
    lastRewardingTimestamp: 0,
  });

  vBUSD.borrowIndex.returns(convertToUnit(1, 18));
  vBUSD.totalBorrows.returns(convertToUnit(10000, 8));
  vBUSD.totalSupply.returns(convertToUnit(10000, 8));
  vBUSD.balanceOf.returns(convertToUnit(100, 8));
  vBUSD.borrowBalanceStored.returns(convertToUnit(100, 8));

  vWBTC.borrowIndex.returns(convertToUnit(1, 18));
  vWBTC.totalBorrows.returns(convertToUnit(100, 18));
  vWBTC.totalSupply.returns(convertToUnit(100, 18));
  vWBTC.balanceOf.returns(convertToUnit(100, 8));
  vWBTC.borrowBalanceStored.returns(convertToUnit(100, 8));

  return {
    comptroller,
    vBUSD,
    vWBTC,
    rewardDistributor1,
    rewardToken1,
    rewardDistributor2,
    rewardToken2,
    rewardDistributor3,
    rewardToken3,
    poolLens,
    startBlock,
  };
};

async function setup(isTimeBased: boolean) {
  if (!isTimeBased) return await loadFixture(rewardsFixture);
  return loadFixture(timeBasedRewardsFixture);
}

for (const isTimeBased of [false, true]) {
  const description = getDescription(isTimeBased);

  describe(`${description}PoolLens: Rewards Summary`, () => {
    beforeEach(async () => {
      [account] = await ethers.getSigners();
      ({
        comptroller,
        vBUSD,
        vWBTC,
        rewardDistributor1,
        rewardToken1,
        rewardDistributor2,
        rewardToken2,
        rewardDistributor3,
        rewardToken3,
        poolLens,
        startBlock,
      } = await setup(isTimeBased));
    });

    it("Should get summary for all markets", async () => {
      // Mine some blocks so deltaBlocks != 0
      await mineUpTo(startBlock + 1000);

      const accountAddress = await account.getAddress();

      const pendingRewards = await poolLens.getPendingRewards(accountAddress, comptroller.address);

      expect(comptroller.getAllMarkets).to.have.been.calledOnce;
      expect(comptroller.getRewardDistributors).to.have.been.calledOnce;

      expect(rewardDistributor1.rewardToken).to.have.been.calledOnce;
      expect(rewardDistributor2.rewardToken).to.have.been.calledOnce;
      expect(rewardDistributor3.rewardToken).to.have.been.calledOnce;

      expect(rewardDistributor1.rewardTokenAccrued).to.have.been.calledOnce;
      expect(rewardDistributor2.rewardTokenAccrued).to.have.been.calledOnce;
      expect(rewardDistributor3.rewardTokenAccrued).to.have.been.calledOnce;

      // Should be called once per market
      if (isTimeBased) {
        expect(rewardDistributor1.rewardTokenBorrowStateTimeBased).to.have.been.callCount(2);
        expect(rewardDistributor2.rewardTokenBorrowStateTimeBased).to.have.been.callCount(2);
        expect(rewardDistributor3.rewardTokenBorrowStateTimeBased).to.have.been.callCount(2);

        expect(rewardDistributor1.rewardTokenSupplyStateTimeBased).to.have.been.callCount(2);
        expect(rewardDistributor2.rewardTokenSupplyStateTimeBased).to.have.been.callCount(2);
        expect(rewardDistributor3.rewardTokenSupplyStateTimeBased).to.have.been.callCount(2);
      } else {
        expect(rewardDistributor1.rewardTokenBorrowState).to.have.been.callCount(2);
        expect(rewardDistributor2.rewardTokenBorrowState).to.have.been.callCount(2);
        expect(rewardDistributor3.rewardTokenBorrowState).to.have.been.callCount(2);

        expect(rewardDistributor1.rewardTokenSupplyState).to.have.been.callCount(2);
        expect(rewardDistributor2.rewardTokenSupplyState).to.have.been.callCount(2);
        expect(rewardDistributor3.rewardTokenSupplyState).to.have.been.callCount(2);
      }

      // Should be called once per reward token configured
      expect(vBUSD.borrowIndex).to.have.been.callCount(3);
      expect(vWBTC.borrowIndex).to.have.been.callCount(3);

      // Should be called once per reward token configured
      expect(vBUSD.totalBorrows).to.have.been.callCount(3);
      expect(vWBTC.totalSupply).to.have.been.callCount(3);

      const EXPECTED_OUTPUT = [
        [
          rewardDistributor1.address,
          rewardToken1.address,
          BigNumber.from(convertToUnit(50, 18)),
          [
            [vBUSD.address, BigNumber.from(convertToUnit(10, 18))],
            [vWBTC.address, BigNumber.from(convertToUnit(0.0000001, 18))],
          ],
        ],
        [
          rewardDistributor2.address,
          rewardToken2.address,
          BigNumber.from(convertToUnit(50, 18)),
          [
            [vBUSD.address, BigNumber.from(convertToUnit(10, 18))],
            [vWBTC.address, BigNumber.from(convertToUnit(0.0000001, 18))],
          ],
        ],
        [
          rewardDistributor3.address,
          rewardToken3.address,
          BigNumber.from(convertToUnit(50, 18)),
          [
            [vBUSD.address, BigNumber.from(convertToUnit(10, 18))],
            [vWBTC.address, BigNumber.from(convertToUnit(0.0000001, 18))],
          ],
        ],
      ];
      expect(pendingRewards).to.have.deep.members(EXPECTED_OUTPUT);
    });

    it("Should return accrued rewards if borrower borrowed before initialization", async () => {
      comptroller.getRewardDistributors.returns([rewardDistributor3.address]);
      rewardDistributor3.rewardTokenBorrowerIndex.returns(0); // Borrower borrowed before initialization, so they have no index

      let blockNumberOrTimestamp = (await ethers.provider.getBlock("latest")).number;
      if (isTimeBased) {
        blockNumberOrTimestamp = (await ethers.provider.getBlock("latest")).timestamp;
        rewardDistributor3.rewardTokenBorrowStateTimeBased.returns({
          index: convertToUnit(1, 36), // Current index is 1.0, double scale
          timestamp: blockNumberOrTimestamp,
          lastRewardingTimestamp: 0,
        });
      } else {
        rewardDistributor3.rewardTokenBorrowState.returns({
          index: convertToUnit(1, 36), // Current index is 1.0, double scale
          block: blockNumberOrTimestamp,
          lastRewardingBlock: 0,
        });
      }
      rewardDistributor3.INITIAL_INDEX.returns(convertToUnit(0.6, 36)); // Should start accruing rewards at 0.6 of the current index

      const pendingRewards = await poolLens.getPendingRewards(await account.getAddress(), comptroller.address);

      // The user has 0.000001% of the market share, and the reward accumulated since the beginning of the
      // distribution is proportional to 1.0 (current index) - 0.6 (initial index) = 0.4. The index gets increased
      // according to the configured distribution speed, so the speed is already included in the computation.
      // The user should have accrued 0.000001% * 0.4 = 0.00000004 of the reward token (assuming the reward token
      // has 18 decimals).
      //
      // Supplier reward is zero, because the global supply index is equal to the user's supply index, and there
      // are no blocks between the last update and the current block. Thus, the results account only for the
      // borrower reward.

      const EXPECTED_OUTPUT = [
        [
          rewardDistributor3.address,
          rewardToken3.address,
          BigNumber.from(convertToUnit(50, 18)),
          [
            [vBUSD.address, BigNumber.from(convertToUnit("0.000000004", 18))],
            [vWBTC.address, BigNumber.from(convertToUnit("0.000000004", 18))],
          ],
        ],
      ];
      expect(pendingRewards).to.have.deep.members(EXPECTED_OUTPUT);
    });

    it("Should revert when mode of PoolLens and RewardsDistributor differ", async () => {
      await mineUpTo(startBlock + 1000);

      const accountAddress = await account.getAddress();

      if (isTimeBased) {
        rewardDistributor3.isTimeBased.returns(false);
      } else {
        rewardDistributor3.isTimeBased.returns(true);
      }
      await expect(poolLens.getPendingRewards(accountAddress, comptroller.address)).to.be.revertedWith(
        "Inconsistent Reward mode",
      );
    });
  });
}
