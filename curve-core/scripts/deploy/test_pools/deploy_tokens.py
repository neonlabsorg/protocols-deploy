import time
import logging
from pathlib import Path

import solcx
import eth_abi
import boa
from boa.contracts.abi.abi_contract import ABIContractFactory

from settings.config import BASE_DIR

logger = logging.getLogger(__name__)

def deploy_tokens(receiver: str | None = None) -> tuple:
    crv = boa.load(
        Path(BASE_DIR, "scripts", "deploy", "test_pools", "contracts", "ERC20mock.vy"),
        "Test Curve Token",
        "TEST_CRV",
        18,
    )
    crvusd = boa.load(
        Path(BASE_DIR, "scripts", "deploy", "test_pools", "contracts", "ERC20mock.vy"),
        "Test CrvUSD Token",
        "TEST_CRVUSD",
        18,
    )

    logger.info(f"CRV deployed at {crv.address}")
    logger.info(f"CRVUSD deployed at {crvusd.address}")

    receiver = receiver if receiver is not None else boa.env.eoa
    crv._mint_for_testing(receiver, 1_000_000 * 10**18)
    crvusd._mint_for_testing(receiver, 1_000_000 * 10**18)

    return crv, crvusd

def deploy_ERC20ForSpl_tokens(receiver: str | None = None) -> tuple:
    filePath = Path(BASE_DIR, "scripts", "deploy", "test_pools", "contracts", "ERC20ForSplFactory.sol")
    contract_name="ERC20ForSplFactory"
    compiled_src = solcx.compile_files(
       [filePath],
       ["abi", "bin"],
       optimize= True,
       optimize_runs= 200
    )
    filePathKey = Path("scripts", "deploy", "test_pools", "contracts", "ERC20ForSplFactory.sol")
    key = f"{filePathKey}:{contract_name}"
    bytecode = compiled_src[key]["bin"]
    bytecode = bytes.fromhex(bytecode)

    abi = compiled_src[key]["abi"]
    types = next(iter([
        [x["type"] for x in entry["inputs"]]
        for entry in abi
        if entry["type"] == "constructor"
    ]), [])
    encoded_args = eth_abi.encode(types, [])

    # Deploy ERC20ForSplFactory
    address, _ = boa.env.deploy_code(boa.env.eoa, None, 0, bytecode + encoded_args)
    erc20ForSplFactory = ABIContractFactory.from_abi_dict(abi).at(address)
    logger.info(f"ERC20ForSplFactory deployed at {erc20ForSplFactory.address}")

    # Deploy ERC20ForSplMintable tokens
    filePath = Path(BASE_DIR, "scripts", "deploy", "test_pools", "contracts", "ERC20ForSplMintable.sol")
    contract_name="ERC20ForSplMintable"
    compiled_src = solcx.compile_files(
       [filePath],
       ["abi", "bin"],
       optimize= True,
       optimize_runs= 200
    )
    filePathKey = Path("scripts", "deploy", "test_pools", "contracts", "ERC20ForSplMintable.sol")
    key = f"{filePathKey}:{contract_name}"
    abi = compiled_src[key]["abi"]

    try:
        erc20ForSplFactory.createErc20ForSplMintable("Test Curve Token", "tCRV", 9, boa.env.eoa)
    except:
        print('Ignoring errors resulting from preflight calls to NeonEVM precompiled contracts')

    while erc20ForSplFactory.allErc20ForSplLength() < 1:
        logger.info(f"Deploying Test Curve Token (tCRV)...")
        time.sleep(3)

    address = erc20ForSplFactory.allErc20ForSpl(0)
    logger.info(f"Test Curve Token (tCRV) deployed at {address}")
    testCurveToken = ABIContractFactory.from_abi_dict(abi).at(address)

    try:
        erc20ForSplFactory.createErc20ForSplMintable("Test CrvUSD Token", "tCRVUSD", 9, boa.env.eoa)
    except:
        print('Ignoring errors resulting from preflight calls to NeonEVM precompiled contracts')

    while erc20ForSplFactory.allErc20ForSplLength() < 2:
        logger.info(f"Deploying Test CrvUSD Token (tCRVUSD)...")
        time.sleep(3)

    address = erc20ForSplFactory.allErc20ForSpl(1)
    logger.info(f"Test CrvUSD Token (tCRVUSD) deployed at {address}")
    testCrvUSDToken = ABIContractFactory.from_abi_dict(abi).at(address)

    try:
        erc20ForSplFactory.createErc20ForSplMintable("Test DAI Token", "tDAI", 9, boa.env.eoa)
    except:
        print('Ignoring errors resulting from preflight calls to NeonEVM precompiled contracts')

    while erc20ForSplFactory.allErc20ForSplLength() < 3:
        logger.info(f"Deploying Test DAI Token (tDAI)...")
        time.sleep(3)

    address = erc20ForSplFactory.allErc20ForSpl(2)
    logger.info(f"Test DAI Token (tDAI) deployed at {address}")
    testDAIToken = ABIContractFactory.from_abi_dict(abi).at(address)

    try:
        erc20ForSplFactory.createErc20ForSplMintable("Test USDC Token", "tUSDC", 6, boa.env.eoa)
    except:
        print('Ignoring errors resulting from preflight calls to NeonEVM precompiled contracts')

    while erc20ForSplFactory.allErc20ForSplLength() < 4:
        logger.info(f"Deploying Test USDC Token (tUSDC)...")
        time.sleep(3)

    address = erc20ForSplFactory.allErc20ForSpl(3)
    logger.info(f"Test USDC Token (tUSDC) deployed at {address}")
    testUSDCToken = ABIContractFactory.from_abi_dict(abi).at(address)

    receiver = receiver if receiver is not None else boa.env.eoa

    try:
        testCurveToken.mint(receiver, 1_000_000 * 10**9)
    except:
        print('Ignoring errors resulting from preflight calls to NeonEVM precompiled contracts')

    try:
        testCrvUSDToken.mint(receiver, 1_000_000 * 10**9)
    except:
        print('Ignoring errors resulting from preflight calls to NeonEVM precompiled contracts')

    try:
        testDAIToken.mint(receiver, 1_000_000 * 10**9)
    except:
        print('Ignoring errors resulting from preflight calls to NeonEVM precompiled contracts')

    try:
        testUSDCToken.mint(receiver, 1_000_000 * 10**6)
    except:
        print('Ignoring errors resulting from preflight calls to NeonEVM precompiled contracts')

    return testCurveToken, testCrvUSDToken, testDAIToken, testUSDCToken

def instantiate_ERC20ForSpl_tokens(deployed_tokens: list) -> tuple:
    # ERC20ForSplMintable tokens
    filePath = Path(BASE_DIR, "scripts", "deploy", "test_pools", "contracts", "ERC20ForSplMintable.sol")
    contract_name="ERC20ForSplMintable"
    compiled_src = solcx.compile_files(
      [filePath],
      ["abi"],
      optimize= True,
      optimize_runs= 200
    )
    filePathKey = Path("scripts", "deploy", "test_pools", "contracts", "ERC20ForSplMintable.sol")
    key = f"{filePathKey}:{contract_name}"
    abi = compiled_src[key]["abi"]

    token0 = ABIContractFactory.from_abi_dict(abi).at(deployed_tokens[0].address)
    token1 = ABIContractFactory.from_abi_dict(abi).at(deployed_tokens[1].address)
    token2 = ABIContractFactory.from_abi_dict(abi).at(deployed_tokens[2].address)
    token3 = ABIContractFactory.from_abi_dict(abi).at(deployed_tokens[3].address)

    return token0, token1, token2, token3

def instantiate_ERC20_token(tokenAddress: str):
    filePath = Path(BASE_DIR, "scripts", "deploy", "test_pools", "contracts", "IERC20.sol")
    contract_name="IERC20"
    compiled_src = solcx.compile_files(
      [filePath],
      ["abi"],
      optimize= True,
      optimize_runs= 200
    )
    filePathKey = Path("scripts", "deploy", "test_pools", "contracts", "IERC20.sol")
    key = f"{filePathKey}:{contract_name}"
    abi = compiled_src[key]["abi"]

    return ABIContractFactory.from_abi_dict(abi).at(tokenAddress)

