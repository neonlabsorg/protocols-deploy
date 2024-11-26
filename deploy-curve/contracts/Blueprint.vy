# Blueprint.vy
owner: public(address)
value: public(uint256)

@external
def initialize(_owner: address, _value: uint256):
    assert self.owner == ZERO_ADDRESS, "Already initialized"
    self.owner = _owner
    self.value = _value
