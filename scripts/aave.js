const { getNamedAccounts, ethers } = require("hardhat");
const { getWeth } = require("./getWeth");
const AMOUNT = ethers.utils.parseEther("0.006");
async function main() {
  await getWeth();
  const { deployer } = await getNamedAccounts();
  // abi and address to interact with AAVE protocol :
  // Lending Pool address Provider : 0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5
  // We will lending pool from address provider :

  const lendingPool = await getLendingPool(deployer);
  console.log(`Lending Pool Address is : ${lendingPool.address}`);

  // // Deposit :
  // // For depositing we first need to approve aave to withdraw tokens from our wallet :

  const wethTokenAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

  await approveERC20(
    wethTokenAddress,
    lendingPool.address,
    ethers.utils.parseEther("123445"),
    deployer
  );
  console.log("Depositing......");

  await lendingPool.deposit(wethTokenAddress, AMOUNT, deployer, 0);
  console.log("Deposited");

  // // Borrow :
  // // How much we have borrowed, how much we have in collateral, how much we can borrow : We wanna answer all these questions :

  let { availableBorrowsETH, totalDebtETH } = await getBorrowUserData(
    lendingPool,
    deployer
  );

  // Always remember amount you can borrow will always be less than what you will deposit as collateral. Since AAVE works on concept of overcollaterised loans.

  // How much DAI can we borrow :
  const DAI_price = await getDaiPrice(deployer);
  console.log(DAI_price.toString());

  const DAI_to_borrow =
    availableBorrowsETH.toString() * (1 / DAI_price.toNumber());
  console.log(`You can borrow ${DAI_to_borrow} DAI`);

  const DAIBorrowinwei = ethers.utils.parseEther(DAI_to_borrow.toString());

  // Let's borrow DAI :

  await borrowDAI(
    "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    lendingPool,
    DAIBorrowinwei,
    deployer
  );

  await getBorrowUserData(lendingPool, deployer);

  // Let's repay the loan taken :

  await repayDAI(
    lendingPool,
    "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    DAIBorrowinwei,
    deployer
  );

  await getBorrowUserData(lendingPool, deployer);
}

async function repayDAI(lendingPool, daiAddress, amount, account) {
  await approveERC20(daiAddress, lendingPool.address, amount, account);

  const tx = await lendingPool.repay(daiAddress, amount, 1, account);
  await tx.wait(1);

  console.log("Loan Repayed!!!!");
}

async function borrowDAI(daiAddress, lendingPool, DAIBorrowinwei, account) {
  const tx = await lendingPool.borrow(
    daiAddress,
    DAIBorrowinwei,
    1,
    0,
    account
  );
  await tx.wait(1);

  console.log("You have borrowed DAI!!!!!");
}

async function getDaiPrice(account) {
  // Address of Price sol : 0xA50ba011c48153De246E5192C8f9258A2ba79Ca9
  const priceOracle = await ethers.getContractAt(
    "PriceOracle",
    "0xA50ba011c48153De246E5192C8f9258A2ba79Ca9",
    account
  );
  const price = await priceOracle.getAssetPrice(
    "0x6B175474E89094C44Da98b954EedeAC495271d0F"
  );

  return price;
}

async function getBorrowUserData(lendingPool, account) {
  const { totalCollateralETH, totalDebtETH, availableBorrowsETH } =
    await lendingPool.getUserAccountData(account);

  console.log(`You have ${totalCollateralETH} ETH deposited as collateral`);
  console.log(`You have ${totalDebtETH} ETH of debt`);
  console.log(`You can borrow ${availableBorrowsETH} ETH`);

  return { availableBorrowsETH, totalDebtETH };
}

async function getLendingPool(account) {
  const ILendingPoolAddressProvider = await ethers.getContractAt(
    "ILendingPoolAddressesProvider",
    "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
    account
  );

  const LendingPoolAddress = await ILendingPoolAddressProvider.getLendingPool();
  const lendingPool = await ethers.getContractAt(
    "ILendingPool",
    LendingPoolAddress,
    account
  );

  return lendingPool;
}

async function approveERC20(contractAddress, spenderAddress, amount, account) {
  const erc20 = await ethers.getContractAt("IERC20", contractAddress, account);
  const tx = await erc20.approve(spenderAddress, amount);
  await tx.wait(1);

  console.log("Approved");
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.log(error);
  });
