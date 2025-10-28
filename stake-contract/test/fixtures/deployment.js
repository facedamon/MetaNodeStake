//使用loadFixture来共享部署状态

const {ethers, upgrades} = require("hardhat")
const {loadFixture} = require("@nomicfoundation/hardhat-network-helpers")

//测试常量
const TEST_CONSTANTS = {
    START_BLOCK: 100,
    END_BLOCK: 1000,
    MIN_DEPOSIT: ethers.parseEther("1"),
    META_NODE_PER_BLOCK: ethers.parseEther("0.1"),
    UNSTAKE_LOCKED_BLOCKS: 100
}

async function deployContractsFixture() {
    //默认第一个为msg.sender
    const [owner, admin, user1, user2, user3, user4] = await ethers.getSigners();
    //部署MetaNode代币
    const MetaNodeToken = await ethers.getContractFactory("MetaNodeToken");
    const metaNodeToken = await MetaNodeToken.deploy();
    await metaNodeToken.waitForDeployment();

    console.log("MetaNodeTokenAddress", await metaNodeToken.getAddress());

    //部署测试ERC20代币
    const TestToken = await ethers.getContractFactory("ERC20Mock");
    const testToken = await TestToken.deploy(
        "TestToken",
        "Test",
        owner.address,
        ethers.parseEther("1000000")
    );
    await testToken.waitForDeployment();

    console.log("TestTokenAddress", await testToken.getAddress());

    //部署MetaNodeStake合约
    //initialize 中的msg.sender为owner
    //owner保留ADMIN_ROLE和DEFAULT_ADMIN_ROLE
    const MetaNodeStake = await ethers.getContractFactory("MetaNodeStake");
    const metaNodeStake = await upgrades.deployProxy(
        MetaNodeStake,
        [
            await metaNodeToken.getAddress(),
            TEST_CONSTANTS.START_BLOCK,
            TEST_CONSTANTS.END_BLOCK,
            TEST_CONSTANTS.META_NODE_PER_BLOCK
        ],
        {
            initializer: 'initialize'
        }
    );
    console.log("MetaNodeStake.address", await metaNodeStake.getAddress());

    //设置管理员角色
    await metaNodeStake.grantRole(await metaNodeStake.ADMIN_ROLE(), admin.address);
    //转移奖励代币到质押合约
    await metaNodeToken.transfer(await metaNodeStake.getAddress(), ethers.parseEther("100000"));

    //分配测试代币给用户
    await testToken.transfer(user1.address, ethers.parseEther("1000"));
    await testToken.transfer(user2.address, ethers.parseEther("1000"));
    await testToken.transfer(user3.address, ethers.parseEther("1000"));
    await testToken.transfer(user4.address, ethers.parseEther("1000"));

    return {
        metaNodeStake,
        metaNodeToken,
        testToken,
        owner,
        admin,
        user1,
        user2,
        user3,
        user4,
        constants: TEST_CONSTANTS
    }
}

async function deployWithPoolsFixture() {
    const base = await deployContractsFixture();
    const {metaNodeStake, admin, testToken, constants} = base;
    //添加ETH池
    await metaNodeStake.connect(admin).addPool(
        ethers.ZeroAddress,
        100,
        constants.MIN_DEPOSIT,
        constants.UNSTAKE_LOCKED_BLOCKS,
        false
    );
    //添加ERC20池
    await metaNodeStake.connect(admin).addPool(
        await testToken.getAddress(),
        100,
        constants.MIN_DEPOSIT,
        constants.UNSTAKE_LOCKED_BLOCKS,
        false
    );
    //授权测试代币
    await testToken.connect(base.user1).approve(await metaNodeStake.getAddress(), ethers.parseEther("1000"));
    await testToken.connect(base.user2).approve(await metaNodeStake.getAddress(), ethers.parseEther("1000"));
    await testToken.connect(base.user3).approve(await metaNodeStake.getAddress(), ethers.parseEther("1000"));

    return base;
}

module.exports = {
    deployWithPoolsFixture,
    deployContractsFixture,
    TEST_CONSTANTS
};