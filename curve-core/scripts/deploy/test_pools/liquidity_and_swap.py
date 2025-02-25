import logging

import boa
from boa.contracts.vyper.vyper_contract import VyperContract
from boa.contracts.base_evm_contract import BoaError

logger = logging.getLogger(__name__)

def add_liquidity(pool: VyperContract, token0: VyperContract, token1: VyperContract, amount: int):
    assert token0.balanceOf(boa.env.eoa) >= amount, "Not enough tokens to add"
    assert token1.balanceOf(boa.env.eoa) >= amount, "Not enough tokens to add"

    token0.approve(pool.address, amount)
    token1.approve(pool.address, amount)

    pool.add_liquidity([amount, amount], 0)

    logger.info("Added liquidity")

def add_liquidity_twocrypto(pool: VyperContract, token0: VyperContract, token1: VyperContract, amount: int):
    # Commenting out following 2 lines because of error resulting from calls to NeonEVM precompiled contracts
    # assert token0.balanceOf(boa.env.eoa) >= amount, "Not enough tokens to add"
    # assert token1.balanceOf(boa.env.eoa) >= amount, "Not enough tokens to add"

    token0.approve(pool.address, amount)
    allowance0 = token0.allowance(boa.env.eoa, pool.address)
    logger.info(f"\nApproved token_0 (allowance: {allowance0})")

    token1.approve(pool.address, amount)
    allowance1 = token1.allowance(boa.env.eoa, pool.address)
    logger.info(f"Approved token_1 (allowance: {allowance1})")

    try:
        pool.add_liquidity([amount, amount], 0)
    except:
        print('Ignoring errors resulting from preflight calls to NeonEVM precompiled contracts')

    LPBalance = pool.balanceOf(boa.env.eoa)
    logger.info(f"\nAdded liquidity (LP balance: {LPBalance})")
    allowance0 = token0.allowance(boa.env.eoa, pool.address)
    logger.info(f"New token_0 allowance: {allowance0}")
    allowance1 = token1.allowance(boa.env.eoa, pool.address)
    logger.info(f"New token_1 allowance: {allowance1}")

def add_liquidity_tricrypto(pool: VyperContract, token0: VyperContract, token1: VyperContract, token2: VyperContract, amount: int):
    # Commenting out following 2 lines because of error resulting from calls to NeonEVM precompiled contracts
    # assert token0.balanceOf(boa.env.eoa) >= amount, "Not enough tokens to add"
    # assert token1.balanceOf(boa.env.eoa) >= amount, "Not enough tokens to add"

    token0.approve(pool.address, amount)
    allowance0 = token0.allowance(boa.env.eoa, pool.address)
    logger.info(f"\nApproved token_0 (allowance: {allowance0})")

    token1.approve(pool.address, amount)
    allowance1 = token1.allowance(boa.env.eoa, pool.address)
    logger.info(f"Approved token_1 (allowance: {allowance1})")

    token2.approve(pool.address, amount)
    allowance2 = token2.allowance(boa.env.eoa, pool.address)
    logger.info(f"Approved token_2 (allowance: {allowance1})")

    try:
        pool.add_liquidity([amount, amount, amount], 0)
    except:
        print('Ignoring errors resulting from preflight calls to NeonEVM precompiled contracts')

    LPBalance = pool.balanceOf(boa.env.eoa)
    logger.info(f"\nAdded liquidity (LP balance: {LPBalance})")
    allowance0 = token0.allowance(boa.env.eoa, pool.address)
    logger.info(f"New token_0 allowance: {allowance0}")
    allowance1 = token1.allowance(boa.env.eoa, pool.address)
    logger.info(f"New token_1 allowance: {allowance1}")
    allowance2 = token2.allowance(boa.env.eoa, pool.address)
    logger.info(f"New token_2 allowance: {allowance2}")

def add_liquidity_meta(pool: VyperContract, token0: VyperContract, token1: VyperContract, amount0: int, amount1: int):
    # Commenting out following 2 lines because of error resulting from calls to NeonEVM precompiled contracts
    # assert token0.balanceOf(boa.env.eoa) >= amount, "Not enough tokens to add"
    # assert token1.balanceOf(boa.env.eoa) >= amount, "Not enough tokens to add"

    token0.approve(pool.address, amount0)
    allowance0 = token0.allowance(boa.env.eoa, pool.address)
    logger.info(f"\nApproved token_0 (allowance: {allowance0})")

    token1.approve(pool.address, amount1)
    allowance1 = token1.allowance(boa.env.eoa, pool.address)
    logger.info(f"Approved token_1 (allowance: {allowance1})")

    try:
        pool.add_liquidity([amount0, amount1], 0)
    except:
        print('Ignoring errors resulting from preflight calls to NeonEVM precompiled contracts')

    LPBalance = pool.balanceOf(boa.env.eoa)
    logger.info(f"\nAdded liquidity (LP balance: {LPBalance})")
    allowance0 = token0.allowance(boa.env.eoa, pool.address)
    logger.info(f"New token_0 allowance: {allowance0}")
    allowance1 = token1.allowance(boa.env.eoa, pool.address)
    logger.info(f"New token_1 allowance: {allowance1}")

def swap(pool: VyperContract, token0: VyperContract, amount: int):
    assert token0.balanceOf(boa.env.eoa) >= amount, "Not enough tokens to add"
    token0.approve(pool.address, amount)
    pool.exchange(0, 1, amount, 0)

    logger.info("Swapped tokens")

def swap_twocrypto(pool: VyperContract, token0: VyperContract, amount: int):
    # Commenting out following line because of error resulting from calls to NeonEVM precompiled contracts
    # assert token0.balanceOf(boa.env.eoa) >= amount, "Not enough tokens to add"
    token0.approve(pool.address, amount)

    allowance0 = token0.allowance(boa.env.eoa, pool.address)
    logger.info(f"\nApproved token_0 (allowance: {allowance0})")

    try:
        pool.exchange(0, 1, amount, 0)
    except:
        print('Ignoring errors resulting from preflight calls to NeonEVM precompiled contracts')

    logger.info(f"\nSwapped {amount} token_0 for token_1")
    allowance0 = token0.allowance(boa.env.eoa, pool.address)
    logger.info(f"New token_0 allowance: {allowance0}")

def swap_tricrypto(pool: VyperContract, token0: VyperContract, token1: VyperContract, amount: int):
    # Commenting out following line because of error resulting from calls to NeonEVM precompiled contracts
    # assert token0.balanceOf(boa.env.eoa) >= amount, "Not enough tokens to add"
    token0.approve(pool.address, amount)

    allowance0 = token0.allowance(boa.env.eoa, pool.address)
    logger.info(f"\nApproved token_0 (allowance: {allowance0})")

    try:
        pool.exchange(0, 1, amount, 0)
    except:
        print('Ignoring errors resulting from preflight calls to NeonEVM precompiled contracts')

    logger.info(f"\nSwapped {amount} token_0 for token_1")
    allowance0 = token0.allowance(boa.env.eoa, pool.address)
    logger.info(f"New token_0 allowance: {allowance0}")

    token1.approve(pool.address, amount)

    allowance1 = token1.allowance(boa.env.eoa, pool.address)
    logger.info(f"\nApproved token_1 (allowance: {allowance1})")
    try:
        pool.exchange(1, 2, amount, 0)
    except:
        print('Ignoring errors resulting from preflight calls to NeonEVM precompiled contracts')

    logger.info(f"\nSwapped {amount} token_1 for token_2")
    allowance1 = token1.allowance(boa.env.eoa, pool.address)
    logger.info(f"New token_1 allowance: {allowance1}")

def swap_meta(pool: VyperContract, token0: VyperContract, amount: int):
    # Commenting out following line because of error resulting from calls to NeonEVM precompiled contracts
    # assert token0.balanceOf(boa.env.eoa) >= amount, "Not enough tokens to add"
    token0.approve(pool.address, amount)

    allowance0 = token0.allowance(boa.env.eoa, pool.address)
    logger.info(f"\nApproved token_0 (allowance: {allowance0})")

    try:
        pool.exchange(0, 1, amount, 0)
    except:
        print('Ignoring errors resulting from preflight calls to NeonEVM precompiled contracts')

    logger.info(f"\nSwapped {amount} token_0 for token_1")
    allowance0 = token0.allowance(boa.env.eoa, pool.address)
    logger.info(f"New token_0 allowance: {allowance0}")

# Swap a metapool token for a token of the underlying base pool
def swap_meta_underlying_out(pool: VyperContract, metapoolToken: VyperContract, underlyingTokenIndex: int, amount: int):
    # Commenting out following line because of error resulting from calls to NeonEVM precompiled contracts
    # assert metapoolToken.balanceOf(boa.env.eoa) >= amount, "Not enough tokens to add"
    metapoolToken.approve(pool.address, amount)

    allowance0 = metapoolToken.allowance(boa.env.eoa, pool.address)
    logger.info(f"\nApproved metapool token (allowance: {allowance0})")

    try:
        pool.exchange_underlying(0, underlyingTokenIndex + 1, amount, 0)
    except:
        print('Ignoring errors resulting from preflight calls to NeonEVM precompiled contracts')

    logger.info(f"\nSwapped {amount} metapool token for underlying token")
    allowance0 = metapoolToken.allowance(boa.env.eoa, pool.address)
    logger.info(f"New metapool token allowance: {allowance0}")

# Swap a token of the underlying base pool for a metapool token
def swap_meta_underlying_in(pool: VyperContract, underlyingToken: VyperContract, underlyingTokenIndex: int, amount: int):
    # Commenting out following line because of error resulting from calls to NeonEVM precompiled contracts
    # assert underlyingToken.balanceOf(boa.env.eoa) >= amount, "Not enough tokens to add"
    underlyingToken.approve(pool.address, amount)

    allowance0 = underlyingToken.allowance(boa.env.eoa, pool.address)
    logger.info(f"\nApproved underlying token (allowance: {allowance0})")

    try:
        pool.exchange_underlying(underlyingTokenIndex + 1, 0, amount, 0)
    except:
        print('Ignoring errors resulting from preflight calls to NeonEVM precompiled contracts')

    logger.info(f"\nSwapped {amount} underlying token for metapool token")
    allowance0 = underlyingToken.allowance(boa.env.eoa, pool.address)
    logger.info(f"New underlying token allowance: {allowance0}")

# Swap two tokens of the underlying base pool
def swap_meta_underlying_both(pool: VyperContract, underlyingToken0: VyperContract, underlyingToken1: VyperContract, underlyingToken0Index: int, underlyingToken1Index: int, amount: int):
    # Commenting out following line because of error resulting from calls to NeonEVM precompiled contracts
    # assert underlyingToken.balanceOf(boa.env.eoa) >= amount, "Not enough tokens to add"
    underlyingToken0.approve(pool.address, amount)

    allowance0 = underlyingToken0.allowance(boa.env.eoa, pool.address)
    logger.info(f"\nApproved underlying token (allowance: {allowance0})")

    try:
        pool.exchange_underlying(underlyingToken0Index + 1, underlyingToken1Index + 1, amount, 0)
    except:
        print('Ignoring errors resulting from preflight calls to NeonEVM precompiled contracts')

    logger.info(f"\nSwapped {amount} underlying token for underlying token")
    allowance0 = underlyingToken0.allowance(boa.env.eoa, pool.address)
    logger.info(f"New underlying token 0 allowance: {allowance0}")
