// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ICurveStableswapFactoryNG} from "./interfaces/ICurveStableswapFactoryNG.sol";


contract CurvePoolFactory {
    address public immutable CurveStableswapFactoryNG;
    
    constructor(
        address _CurveStableswapFactoryNG
    ) {
        CurveStableswapFactoryNG = _CurveStableswapFactoryNG;
    }

    function deploy(
        string memory _name,
        string memory _symbol,
        address[] calldata _coins,
        uint256 _A,
        uint256 _fee,
        uint256 _offpeg_fee_multiplier,
        uint256 _ma_exp_time,
        uint256 _implementation_idx,
        uint8[] calldata _asset_types,
        bytes4[] calldata _method_ids,
        address[] calldata _oracles
    ) external returns (address) {
        return ICurveStableswapFactoryNG(CurveStableswapFactoryNG).deploy_plain_pool(
            _name, 
            _symbol, 
            _coins, 
            _A, 
            _fee, 
            _offpeg_fee_multiplier, 
            _ma_exp_time, 
            _implementation_idx, 
            _asset_types, 
            _method_ids, 
            _oracles
        );
    }
}