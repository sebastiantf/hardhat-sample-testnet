import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs';
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('Lock', function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployOneYearLockFixture() {
    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    const ONE_GWEI = 1_000_000_000;

    const lockedAmount = ONE_GWEI;
    const unlockTime = Math.floor(Date.now() / 1000) + 5;

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Lock = await ethers.getContractFactory('Lock');
    const lock = await Lock.deploy(unlockTime, { value: lockedAmount });

    return { lock, unlockTime, lockedAmount, owner, otherAccount };
  }

  describe('Deployment', function () {
    it('Should set the right unlockTime', async function () {
      const { lock, unlockTime } = await deployOneYearLockFixture();

      expect(await lock.unlockTime()).to.equal(unlockTime);
    });

    it('Should set the right owner', async function () {
      const { lock, owner } = await deployOneYearLockFixture();

      expect(await lock.owner()).to.equal(owner.address);
    });

    it('Should receive and store the funds to lock', async function () {
      const { lock, lockedAmount } = await deployOneYearLockFixture();

      expect(await ethers.provider.getBalance(lock.target)).to.equal(
        lockedAmount
      );
    });

    it('Should fail if the unlockTime is not in the future', async function () {
      // We don't use the fixture here because we want a different deployment
      const latestTime = Math.floor(Date.now() / 1000);
      const Lock = await ethers.getContractFactory('Lock');
      await expect(Lock.deploy(latestTime, { value: 1 })).to.be.revertedWith(
        'Unlock time should be in the future'
      );
    });
  });

  describe('Withdrawals', function () {
    describe('Validations', function () {
      it('Should revert with the right error if called too soon', async function () {
        const { lock } = await deployOneYearLockFixture();

        await expect(lock.withdraw()).to.be.revertedWith(
          "You can't withdraw yet"
        );
      });

      it.skip('Should revert with the right error if called from another account', async function () {
        const { lock, unlockTime, otherAccount } =
          await deployOneYearLockFixture();

        // We use lock.connect() to send a transaction from another account
        await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith(
          "You aren't the owner"
        );
      });

      it.skip("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
        const { lock, unlockTime } = await deployOneYearLockFixture();

        await expect(lock.withdraw()).not.to.be.reverted;
      });
    });

    describe('Events', function () {
      it.skip('Should emit an event on withdrawals', async function () {
        const { lock, unlockTime, lockedAmount } =
          await deployOneYearLockFixture();

        await expect(lock.withdraw())
          .to.emit(lock, 'Withdrawal')
          .withArgs(lockedAmount, anyValue); // We accept any value as `when` arg
      });
    });

    describe('Transfers', function () {
      it.skip('Should transfer the funds to the owner', async function () {
        const { lock, unlockTime, lockedAmount, owner } =
          await deployOneYearLockFixture();

        await expect(lock.withdraw()).to.changeEtherBalances(
          [owner, lock],
          [lockedAmount, -lockedAmount]
        );
      });
    });
  });
});
