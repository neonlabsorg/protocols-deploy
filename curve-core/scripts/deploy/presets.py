from pydantic import BaseModel
from typing import List

class CryptoPoolPresets(BaseModel):
    A: int = 20000000
    gamma: int = 1000000000000000
    mid_fee: int = 5000000
    out_fee: int = 45000000
    fee_gamma: int = 5000000000000000
    allowed_extra_profit: int = 10000000000
    adjustment_step: int = 5500000000000
    ma_exp_time: int = 866
    initial_price: int = 10**18

class TriCryptoPoolPresets(BaseModel):
    A: int = 20000000
    gamma: int = 1000000000000000
    mid_fee: int = 5000000
    out_fee: int = 45000000
    fee_gamma: int = 5000000000000000
    allowed_extra_profit: int = 10000000000
    adjustment_step: int = 5500000000000
    ma_exp_time: int = 866
    initial_prices: List = [10**18, 10**18]

class StableSwapPlainPoolPresets(BaseModel):
    A: int = 10 # amplification coefficient
    fee: int = 10000000 # 0.1% fee
    offpeg_fee_multiplier: int = 3
    ma_exp_time: int = 866 # 10 minutes EMA (averaging window for oracles)
    implementation_idx: int = 0 # index of the implementation to use
    asset_types: List = [0, 0, 0] # asset types for pool (see stableswap pool implementation, 0 => standard ERC20 token with no additional features)
    method_ids: List = [bytes.fromhex("00000000"), bytes.fromhex("00000000"), bytes.fromhex("00000000")] # array of first four bytes of the Keccak-256 hash of the rate oracle function signature
    oracles: List = ["0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000"] # array of rate oracle addresses

class StableSwapMetaPoolPresets(BaseModel):
    A: int = 10 # amplification coefficient
    fee: int = 10000000 # 0.1% fee
    offpeg_fee_multiplier: int = 3
    ma_exp_time: int = 866 # 10 minutes EMA (averaging window for oracles)
    implementation_idx: int = 0 # index of the implementation to use
    asset_type: int = 0 # asset type for pool (see stableswap pool implementation, 0 => standard ERC20 token with no additional features)
    method_id: bytes = bytes.fromhex("00000000") # first four bytes of the Keccak-256 hash of the rate oracle function signature
    oracle: str = "0x0000000000000000000000000000000000000000" # rate oracle address
