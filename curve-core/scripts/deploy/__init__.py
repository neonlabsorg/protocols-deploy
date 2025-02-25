import os
from pathlib import Path

import click

from scripts.logging_config import get_logger
from scripts.tests.post_deploy import test_post_deploy
from scripts.tests.pre_deployment import test_pre_deploy
from settings.config import BASE_DIR, get_chain_settings, settings
from settings.models import RollupType

from .amm.stableswap import deploy_stableswap
from .amm.tricrypto import deploy_tricrypto
from .amm.twocrypto import deploy_twocrypto
from .deployment_utils import dump_initial_chain_settings, get_deployment_config, get_deployment_obj
from .gauge.child_gauge import deploy_liquidity_gauge_infra
from .governance.xgov import deploy_dao_vault, deploy_xgov, transfer_ownership
from .helpers.deposit_and_stake_zap import deploy_deposit_and_stake_zap
from .helpers.rate_provider import deploy_rate_provider
from .helpers.router import deploy_router
from .helpers.stable_swap_meta_zap import deploy_stable_swap_meta_zap
from .models import Pool, Token
from .registries.address_provider import deploy_address_provider, update_address_provider
from .registries.metaregistry import deploy_metaregistry, update_metaregistry
from .test_pools.deploy_tokens import deploy_tokens, deploy_ERC20ForSpl_tokens, instantiate_ERC20ForSpl_tokens, instantiate_ERC20_token
from .test_pools.liquidity_and_swap import add_liquidity, add_liquidity_twocrypto, add_liquidity_tricrypto, add_liquidity_meta, swap, swap_twocrypto, swap_tricrypto, swap_meta, swap_meta_underlying_out, swap_meta_underlying_in, swap_meta_underlying_both
from .test_pools.deploy_pool import PoolType, StableSwapPoolType, deploy_pool, add_base_pool

logger = get_logger()


@click.group(name="deploy")
def deploy_commands():
    """Commands related to deploy"""
    pass


@deploy_commands.command("all", short_help="deploy all to chain")
@click.argument("chain_config_file", type=click.STRING)
def run_deploy_all(chain_config_file: str) -> None:

    # in case we have a few deployed contracts not deployed via curve-core
    # we will ignore them, e.g. relayer, agent blueprint etc. needed for testing
    # xgov.
    ignore_tests = []
    chain_settings = get_chain_settings(chain_config_file)
    if chain_settings.rollup_type == RollupType.zksync:
        raise NotImplementedError("zksync currently not supported")

    # If we are in debug mode, we want to remove the existing deployment file
    # so that there are no errors while trying to fetch state from a non-existent forked deployment
    if settings.DEBUG:

        # create debug filepath
        debug_filepath = Path(BASE_DIR, "deployments", "debug")
        if not debug_filepath.exists():
            os.mkdir(debug_filepath)

        deployment_file_path = Path(BASE_DIR, "deployments", "debug", f"{chain_settings.file_name}.yaml")
        if deployment_file_path.exists():
            logger.info(f"Removing existing deployment file {deployment_file_path} for debug deployment")
            deployment_file_path.unlink()

    # pre-deployment tests:
    test_pre_deploy(chain_settings.chain_id)

    # Save chain settings
    dump_initial_chain_settings(chain_settings)

    # check if there is a need to deploy xgov:
    if chain_settings.rollup_type == RollupType.not_rollup or (
        chain_settings.dao.ownership_admin and chain_settings.dao.parameter_admin and chain_settings.dao.emergency_admin
    ):
        logger.info("No xgov for L1, setting admins from chain_settings file ...")
        admins = (
            chain_settings.dao.ownership_admin,
            chain_settings.dao.parameter_admin,
            chain_settings.dao.emergency_admin,
        )
        ignore_tests.append("xgov")

    else:

        logger.info("Deploying xgov ...")
        admins = deploy_xgov(chain_settings)

        # get updated chain settings from deployment file
        chain_settings = get_deployment_config(chain_settings).config

    # Check if there is a need to deploy dao vault
    if chain_settings.dao.vault:
        dao_vault = chain_settings.dao.vault
    else:
        logger.info("Deploying Vault ...")
        dao_vault = deploy_dao_vault(chain_settings, admins[0]).address
        chain_settings = get_deployment_config(chain_settings).config

    # Old compatibility
    fee_receiver = dao_vault

    # deploy (reward-only) gauge factory and contracts
    child_gauge_factory = deploy_liquidity_gauge_infra(chain_settings)

    # address provider:
    address_provider = deploy_address_provider(chain_settings)

    # metaregistry
    gauge_type = -1  # we set gauge type to -1 until there's an actual gauge type later
    deploy_metaregistry(chain_settings, child_gauge_factory.address, gauge_type)

    # router
    deploy_router(chain_settings)

    # deploy amms:
    deploy_stableswap(chain_settings, fee_receiver)
    deploy_tricrypto(chain_settings, fee_receiver)
    deploy_twocrypto(chain_settings, fee_receiver)

    # deposit and stake zap
    deploy_deposit_and_stake_zap(chain_settings)

    # meta zap
    deploy_stable_swap_meta_zap(chain_settings)

    # rate provider
    deploy_rate_provider(chain_settings, address_provider.address)

    # update metaregistry
    update_metaregistry(chain_settings)

    # update address provider
    update_address_provider(chain_settings)

    # transfer ownership to the dao
    transfer_ownership(chain_settings)

    # test post deployment
    test_post_deploy(chain_config_file, ignore_tests)

    # final!
    logger.info("Infra deployed and tested!")


@deploy_commands.command("governance", short_help="deploy governance")
@click.argument("chain_config_file", type=click.STRING)
def run_deploy_governance(chain_config_file: str) -> None:
    chain_settings = get_chain_settings(chain_config_file)
    admins = deploy_xgov(chain_settings)
    deploy_dao_vault(chain_settings, admins[0])


@deploy_commands.command("router", short_help="deploy router")
@click.argument("chain_config_file", type=click.STRING)
def run_deploy_router(chain_config_file: str) -> None:
    chain_settings = get_chain_settings(chain_config_file)
    deploy_router(chain_settings)


@deploy_commands.command("address_provider", short_help="deploy address provider")
@click.argument("chain_config_file", type=click.STRING)
def run_deploy_address_provider(chain_config_file: str) -> None:
    chain_settings = get_chain_settings(chain_config_file)
    deploy_address_provider(chain_settings)


@deploy_commands.command("stableswap", short_help="deploy stableswap infra")
@click.argument("chain_config_file", type=click.STRING)
@click.argument("fee_receiver", type=click.STRING)
def run_deploy_stableswap(chain_config_file: str, fee_receiver: str) -> None:
    chain_settings = get_chain_settings(chain_config_file)
    deploy_stableswap(chain_settings, fee_receiver)


@deploy_commands.command("tricrypto", short_help="deploy tricrypto infra")
@click.argument("chain_config_file", type=click.STRING)
@click.argument("fee_receiver", type=click.STRING)
def run_deploy_tricrypto(chain_config_file: str, fee_receiver: str) -> None:
    chain_settings = get_chain_settings(chain_config_file)
    deploy_tricrypto(chain_settings, fee_receiver)


@deploy_commands.command("twocrypto", short_help="deploy twocrypto infra")
@click.argument("chain_config_file", type=click.STRING)
@click.argument("fee_receiver", type=click.STRING)
def run_deploy_twocrypto(chain_config_file: str, fee_receiver: str) -> None:
    chain_settings = get_chain_settings(chain_config_file)
    deploy_twocrypto(chain_settings, fee_receiver)


@deploy_commands.command("crypto_pool", short_help="deploy twocrypto pool")
@click.argument("chain", type=click.STRING)
@click.argument("name", type=click.STRING)
@click.argument("symbol", type=click.STRING)
@click.argument("coins", type=click.STRING)
def run_deploy_twocrypto(chain: str, name: str, symbol: str, coins: str) -> None:
    deploy_pool(chain, name, symbol, coins.split(","))


@deploy_commands.command("test_tokens", short_help="deploy test tokens and pool on devnet")
@click.argument("chain", type=click.STRING)
@click.option("--receiver", default=None, type=click.STRING)
def run_test_tokens_deployment(chain: str, receiver: str | None = None) -> None:
    chain_settings = get_chain_settings(f"{chain}.yaml")
    assert chain_settings.is_testnet, "Only for devnets"

    deployment_file = get_deployment_obj(chain_settings)
    deployment_config = deployment_file.get_deployment_config()
    assert deployment_config is not None, "No deployment"

    token0, token1 = deploy_tokens(receiver)
    tokens = [Token(address=token0.address), Token(address=token1.address)]
    deployment_config.tokens = tokens
    deployment_file.update_deployment_config(deployment_config.model_dump())

@deploy_commands.command("test_pools", short_help="deploy test tokens and pool on devnet")
@click.argument("chain", type=click.STRING)
def run_test_pools_deployment(chain: str) -> None:
    chain_settings = get_chain_settings(f"{chain}.yaml")
    assert chain_settings.is_testnet, "Only for devnets"

    deployment_file = get_deployment_obj(chain_settings)
    deployment_config = deployment_file.get_deployment_config()
    assert deployment_config is not None, "No deployment"

    token0, token1 = deploy_tokens()
    tokens = [Token(address=token0.address), Token(address=token1.address)]
    deployment_config.tokens = tokens

    pool, factory_address = deploy_pool(chain, "Test", "TST", [token0.address, token1.address])
    deployment_config.pools = [
        Pool(symbol="TST", address=str(pool.address), factory=str(factory_address), tokens=tokens)
    ]
    deployment_file.update_deployment_config(deployment_config.model_dump())

    add_liquidity(pool, token0, token1, 10_000 * 10**18)
    swap(pool, token0, 1_000 * 10**18)

@deploy_commands.command("neon_pools", short_help="deploy test tokens and pool on NeonEVM devnet")
@click.argument("chain", type=click.STRING)
def run_test_pools_deployment(chain: str) -> None:
    chain_settings = get_chain_settings(f"{chain}.yaml")
    assert (chain_settings.public_rpc_url == "https://devnet.neonevm.org") | (chain_settings.public_rpc_url == "https://curve-stand.neontest.xyz"), "Only for NeonEVM devnets"

    deployment_file = get_deployment_obj(chain_settings)
    deployment_config = deployment_file.get_deployment_config()
    assert deployment_config is not None, "No deployment"

    stableswap_plain_pool = None

    # Tokens
    if deployment_config.tokens is None:
        token0, token1, token2, token3 = deploy_ERC20ForSpl_tokens()
        # Update deployment file
        deployment_config.tokens = [Token(address=token0.address), Token(address=token1.address), Token(address=token2.address), Token(address=token3.address)]
        deployment_file.update_deployment_config(deployment_config.model_dump())
    elif len(deployment_config.tokens) < 4:
        token0, token1, token2, token3 = deploy_ERC20ForSpl_tokens()
        # Update deployment file
        deployment_config.tokens = [Token(address=token0.address), Token(address=token1.address), Token(address=token2.address), Token(address=token3.address)]
        deployment_file.update_deployment_config(deployment_config.model_dump())
    else:
        token0, token1, token2, token3 = instantiate_ERC20ForSpl_tokens(deployment_config.tokens)

    # TwoCryptoSwap base pool
    twocryptoswap_pool, twocryptoswap_factory_address = deploy_pool(chain, "TwoCryptoSwap", "TWO-CRYPTO", [token0.address, token1.address], PoolType.twocryptoswap)
    add_liquidity_twocrypto(twocryptoswap_pool, token0, token1, 10_000 * 10**9)
    swap_twocrypto(twocryptoswap_pool, token0, 1_000 * 10**9)
    # Save TwoCryptoSwap pool config
    poolConfig = Pool(symbol="TWO-CRYPTO", address=str(twocryptoswap_pool.address), factory=str(twocryptoswap_factory_address), tokens=[Token(address=token0.address), Token(address=token1.address)])
    deployment_config = deployment_file.get_deployment_config()
    if (deployment_config.pools is not None):
        deployment_config.pools.append(poolConfig)
    else:
        deployment_config.pools = [poolConfig]
    deployment_file.update_deployment_config(deployment_config.model_dump())

    # TriCryptoSwap base pool
    wneon = chain_settings.wrapped_native_token
    tricryptoswap_pool, tricryptoswap_factory_address = deploy_pool(chain, "TriCryptoSwap", "TRI-CRYPTO", [token0.address, token1.address, token2.address], PoolType.tricryptoswap, StableSwapPoolType.none, wneon)
    add_liquidity_tricrypto(tricryptoswap_pool, token0, token1, token2, 10_000 * 10**9)
    swap_tricrypto(tricryptoswap_pool, token0, token1, 1_000 * 10**9)
    # Save TriCryptoSwap pool config
    poolConfig = Pool(symbol="TRI-CRYPTO", address=str(tricryptoswap_pool.address), factory=str(tricryptoswap_factory_address), tokens=[Token(address=token0.address), Token(address=token1.address), Token(address=token2.address)])
    deployment_config = deployment_file.get_deployment_config()
    if (deployment_config.pools is not None):
        deployment_config.pools.append(poolConfig)
    else:
        deployment_config.pools = [poolConfig]
    deployment_file.update_deployment_config(deployment_config.model_dump())

    # StableSwap plain pool
    stableswap_plain_pool, stableswap_factory_address = deploy_pool(chain, "StableSwap Plain", "STA-PLAIN", [token0.address, token1.address, token2.address], PoolType.stableswap, StableSwapPoolType.plain)
    add_liquidity_tricrypto(stableswap_plain_pool, token0, token1, token2, 10_000 * 10**9)
    swap_tricrypto(stableswap_plain_pool, token0, token1, 1_000 * 10**9)
    # Save StableSwap plain pool config
    poolConfig =  Pool(symbol="STA-PLAIN", address=str(stableswap_plain_pool.address), factory=str(stableswap_factory_address), tokens=[Token(address=token0.address), Token(address=token1.address), Token(address=token2.address)])
    deployment_config = deployment_file.get_deployment_config()
    if deployment_config.pools is not None:
        deployment_config.pools.append(poolConfig)
    else:
        deployment_config.pools = [poolConfig]
    deployment_file.update_deployment_config(deployment_config.model_dump())

    # StableSwap meta pool
    basePoolAddress = None
    if stableswap_plain_pool is not None:
        basePoolAddress = stableswap_plain_pool.address
    else:
        deployment_config = deployment_file.get_deployment_config()
        assert (deployment_config.pools is not None), "No pools deployed"
        for _pool in deployment_config.pools:
            if _pool.symbol == "STA-PLAIN":
                basePoolAddress = _pool.address
                break
    basePoolLPToken = instantiate_ERC20_token(basePoolAddress)
    add_base_pool(chain, basePoolAddress, basePoolLPToken.address, [0, 0, 0], 3)
    stableswap_meta_pool, stableswap_factory_address = deploy_pool(chain, "StableSwap Meta", "STA-META", [token3.address], PoolType.stableswap, StableSwapPoolType.meta, None, basePoolAddress)
    add_liquidity_meta(stableswap_meta_pool, token3, basePoolLPToken, 10_000 * 10**6, 10_000 * 10**18)
    swap_meta(stableswap_meta_pool, token3, 100 * 10**6)
    swap_meta_underlying_out(stableswap_meta_pool, token3, 0, 100 * 10**6)
    swap_meta_underlying_in(stableswap_meta_pool, token1, 1, 1_000 * 10**9)
    swap_meta_underlying_both(stableswap_meta_pool, token0, token2, 0, 2, 1_000 * 10**9)
    # Save StableSwap meta pool config
    poolConfig =  Pool(symbol="STA-META", address=str(stableswap_meta_pool.address), factory=str(stableswap_factory_address), tokens=[Token(address=token3.address), Token(address=basePoolLPToken.address)])
    deployment_config = deployment_file.get_deployment_config()
    if deployment_config.pools is not None:
        deployment_config.pools.append(poolConfig)
    else:
        deployment_config.pools = [poolConfig]
    deployment_file.update_deployment_config(deployment_config.model_dump())
