const { getNamedAccounts, ethers } = require("hardhat");
const AMOUNT = ethers.utils.parseEther("0.01");
async function getWeth() {
  const { deployer } = await getNamedAccounts();
  // calling deposit function on weth function :
  // 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2 address weth mainnet :

  const iWeth = await ethers.getContractAt(
    "IWeth",
    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    deployer
  );

  const transactionResponse = await iWeth.deposit({ value: AMOUNT });
  await transactionResponse.wait(1);

  // Just depositing ethereum and in return getting WETH.
  const balance = await iWeth.balanceOf(deployer);
  console.log(balance.toString());
}

module.exports = {
  getWeth,
};
