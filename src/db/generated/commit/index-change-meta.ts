// automatically generated by the FlatBuffers compiler, do not modify

import * as flatbuffers from 'flatbuffers';

export class IndexChangeMeta {
  bb: flatbuffers.ByteBuffer | null = null;
  bb_pos = 0;
  __init(i: number, bb: flatbuffers.ByteBuffer): IndexChangeMeta {
    this.bb_pos = i;
    this.bb = bb;
    return this;
  }

  static getRootAsIndexChangeMeta(
    bb: flatbuffers.ByteBuffer,
    obj?: IndexChangeMeta,
  ): IndexChangeMeta {
    return (obj || new IndexChangeMeta()).__init(
      bb.readInt32(bb.position()) + bb.position(),
      bb,
    );
  }

  static getSizePrefixedRootAsIndexChangeMeta(
    bb: flatbuffers.ByteBuffer,
    obj?: IndexChangeMeta,
  ): IndexChangeMeta {
    bb.setPosition(bb.position() + flatbuffers.SIZE_PREFIX_LENGTH);
    return (obj || new IndexChangeMeta()).__init(
      bb.readInt32(bb.position()) + bb.position(),
      bb,
    );
  }

  lastMutationId(): flatbuffers.Long {
    const offset = this.bb!.__offset(this.bb_pos, 4);
    return offset
      ? this.bb!.readUint64(this.bb_pos + offset)
      : this.bb!.createLong(0, 0);
  }

  static startIndexChangeMeta(builder: flatbuffers.Builder) {
    builder.startObject(1);
  }

  static addLastMutationId(
    builder: flatbuffers.Builder,
    lastMutationId: flatbuffers.Long,
  ) {
    builder.addFieldInt64(0, lastMutationId, builder.createLong(0, 0));
  }

  static endIndexChangeMeta(builder: flatbuffers.Builder): flatbuffers.Offset {
    const offset = builder.endObject();
    return offset;
  }

  static createIndexChangeMeta(
    builder: flatbuffers.Builder,
    lastMutationId: flatbuffers.Long,
  ): flatbuffers.Offset {
    IndexChangeMeta.startIndexChangeMeta(builder);
    IndexChangeMeta.addLastMutationId(builder, lastMutationId);
    return IndexChangeMeta.endIndexChangeMeta(builder);
  }
}