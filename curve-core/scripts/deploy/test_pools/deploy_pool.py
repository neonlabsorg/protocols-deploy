import time
import logging
from enum import StrEnum
from pathlib import Path

import boa

from settings.config import BASE_DIR

from ..deployment_file import YamlDeploymentFile
from ..presets import CryptoPoolPresets, TriCryptoPoolPresets, StableSwapPlainPoolPresets, StableSwapMetaPoolPresets
from ..utils import fetch_latest_contract

logger = logging.getLogger(__name__)

class PoolType(StrEnum):
    twocryptoswap = "twocryptoswap"
    tricryptoswap = "tricryptoswap"
    stableswap = "stableswap"

class StableSwapPoolType(StrEnum):
    plain = " plain"
    meta = " meta"
    none = ""

def deploy_pool(
    chain: str,
    name: str,
    symbol: str,
    coins: list[str],
    pool_type: PoolType = PoolType.twocryptoswap,
    stableswap_pool_type: StableSwapPoolType = StableSwapPoolType.none,
    wethAddress = None,
    basePoolAddress = None
):
    deployment_file_path = Path(BASE_DIR, "deployments", f"{chain}.yaml")
    deployment_file = YamlDeploymentFile(deployment_file_path)
    factory = deployment_file.get_contract_deployment(("contracts", "amm", pool_type.value, "factory")).get_contract()

    pools_count = 0
    try:
        pools_count = factory.pool_count()
    except DecodeError:
        print('Ignoring DecodeError when factory.pool_count is not yet initialized')

    try:
        logger.info(f"\nDeploying test {pool_type.value}{stableswap_pool_type.value} pool...")
        if pool_type == PoolType.twocryptoswap:
            pool_address = factory.deploy_pool(name, symbol, coins, 0, *CryptoPoolPresets().model_dump().values())
        elif pool_type == PoolType.tricryptoswap:
            pool_address = factory.deploy_pool(name, symbol, coins, wethAddress, 0, *TriCryptoPoolPresets().model_dump().values())
        elif pool_type == PoolType.stableswap:
            if stableswap_pool_type == StableSwapPoolType.plain:
                pool_address = factory.deploy_plain_pool(name, symbol, coins, *StableSwapPlainPoolPresets().model_dump().values())
            elif stableswap_pool_type == StableSwapPoolType.meta:
                pool_address = factory.deploy_metapool(basePoolAddress, name, symbol, coins[0], *StableSwapMetaPoolPresets().model_dump().values())
    except:
        print('Ignoring errors resulting from preflight calls to NeonEVM precompiled contracts')

    while factory.pool_count() <= pools_count:
        logger.info(f"Waiting for test {pool_type.value}{stableswap_pool_type.value} pool deployment...")
        time.sleep(3)

    pool_address = factory.pool_list(pools_count)
    logger.info(f"Test {pool_type.value}{stableswap_pool_type.value} pool deployed at {pool_address}")

    if (pool_type == PoolType.stableswap) & (stableswap_pool_type == StableSwapPoolType.meta):
        pool = boa.load_partial(
            fetch_latest_contract(Path(BASE_DIR, "contracts", "amm", pool_type.value, "meta_implementation"))
        ).at(pool_address)
    else:
        pool = boa.load_partial(
            fetch_latest_contract(Path(BASE_DIR, "contracts", "amm", pool_type.value, "implementation"))
        ).at(pool_address)

    return pool, factory.address

def add_base_pool(
    chain: str,
    basePoolAddress: str,
    basePoolLPTokenAddress: str,
    basePoolAssetTypes: list,
    basePoolNCoins: int
):
    deployment_file_path = Path(BASE_DIR, "deployments", f"{chain}.yaml")
    deployment_file = YamlDeploymentFile(deployment_file_path)
    factory = deployment_file.get_contract_deployment(("contracts", "amm", "stableswap", "factory")).get_contract()

    _, basePoolCoins, _, _, _ = factory.base_pool_data(basePoolAddress)
    if len(basePoolCoins) == 0:
        boa.env.eoa = '0x25537a5De4ccaCC9fb6beE5BC43E431c2459AFDF' # Set admin account as tx.origin (only admin is allowed to add base pool)
        try:
            logger.info(f"\nRegistering base pool into StableSwap pool factory's registry...")
            factory.add_base_pool(basePoolAddress, basePoolLPTokenAddress, basePoolAssetTypes, basePoolNCoins)
        except:
            print('Ignoring errors resulting from preflight calls to NeonEVM precompiled contracts')
        boa.env.eoa = '0xd496571BE7A0aD26c831858eE9B7C8995d9ddC2a' # Re-set deployer account as tx.origin
    else:
        logger.info(f"\nBase pool {basePoolAddress} already registered into StableSwap pool factory's registry")
