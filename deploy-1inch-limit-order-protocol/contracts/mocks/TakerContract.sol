// SPDX-License-Identifier: MIT

pragma solidity 0.8.23;

import { IOrderMixin } from "../interfaces/IOrderMixin.sol";
import { TakerTraits } from "../libraries/TakerTraitsLib.sol";
import { IERC20ForSPL } from "../IERC20ForSPL.sol";

contract TakerContract {
    IOrderMixin private immutable _SWAP;

    constructor(IOrderMixin swap) {
        _SWAP = swap;
    }

    function fillOrder(
        address takerAsset,
        IOrderMixin.Order calldata order,
        bytes32 r,
        bytes32 vs,
        uint256 amount,
        TakerTraits takerTraits
    ) external payable {
        IERC20ForSPL(takerAsset).approve(address(_SWAP), order.takingAmount);

        _SWAP.fillOrder {value: msg.value} (order, r, vs, amount, takerTraits);
    }
}
