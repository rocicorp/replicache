// This file implements our B+Tree nodes, which wrap flatbuffers.

// TODO remove this once this code is called from repc.
#![allow(dead_code)]

use super::nodes_generated::nodes as fb;
use std::cmp::Ordering;
use std::iter::Iterator;
use str_macro::str;

// TODO:
//   - read/write to/from Chunk
//   - validate node on load
//   - implement insert() into a Node
//   - propagate hash and/or max key change from a node to its parents
//   - save to/from the dag
//   - provide degenerate 2-level btree::DagMap and replace prolly::Map with it
//   - provide a nice way to print a Node and DagMap
//   - turn btree::DagMap into a full B+Tree

// Node is a node in our B+Tree. A Node wraps a flatbuffer node of the corresponding
// type. A Leaf node is a special case of InternalNode.
#[derive(Debug)]
pub enum Node<'a> {
    Internal(fb::InternalNode<'a>),
    Leaf(fb::InternalNode<'a>),
    Data(fb::DataNode<'a>),
}

impl Node<'_> {
    // key_iter returns an Iterator that iterates the keys contained in the node.
    pub fn key_iter<'b, 'a: 'b>(&'a self) -> Box<dyn Iterator<Item = &'a [u8]> + 'b> {
        match self {
            Node::Leaf(n) | Node::Internal(n) => {
                // TODO implement validation on node creation so this unwrap() is not dangerous.
                Box::new(InternalNodeKeyIterator::new(n.edges().unwrap()))
            }
            // TODO implement validation on node creation so this unwrap() is not dangerous.
            Node::Data(n) => Box::new(DataNodeKeyIterator::new(n.entries().unwrap())),
        }
    }

    // find returns the index of the given key in the Node if it exists. Its signature emulates
    // Vec::binary_search: it returns Ok(i) to indicate the key was found at entry i and
    // Err(i) to indicate the key was not found but would belong at position i. This signature is
    // useful for inserting a new entry into its appropriate position in the sorted order, and,
    // for internal nodes, finding which edge to follow in the search down the tree for a key.
    pub fn find(&self, key: &[u8]) -> Result<usize, usize> {
        let mut end = 0;
        for cur in self.key_iter().enumerate() {
            match key.cmp(cur.1) {
                Ordering::Equal => return Ok(cur.0),
                Ordering::Less => return Err(cur.0),
                Ordering::Greater => end = cur.0 + 1,
            }
        }
        Err(end)
    }
}

// node_try_from_node_record converts from a flatbuffer NodeRecord into a Node. I would
// have liked to implement the TryFrom trait to do this but I couldn't get the lifetimes
// to work out and finally gave up.
pub fn node_try_from_node_record(node_record: fb::NodeRecord) -> Result<Node, NodeError> {
    use NodeError::*;

    let node = match node_record.record_type() {
        fb::Node::Internal => Node::Internal(
            node_record
                .record_as_internal()
                .ok_or_else(|| Corrupt(str!("Expected InternalNode")))?,
        ),
        fb::Node::Leaf => Node::Leaf(
            node_record
                .record_as_leaf()
                .ok_or_else(|| Corrupt(str!("Expected LeafNode")))?,
        ),
        fb::Node::Data => Node::Data(
            node_record
                .record_as_data()
                .ok_or_else(|| Corrupt(str!("Expected DataNode")))?,
        ),
        _ => {
            return Err(Corrupt(format!(
                "Unknown node type {:?} (most likely parsing garbage)",
                node_record.record_type()
            )))
        }
    };

    // TODO(phritz): validate the node before returning it here.
    Ok(node)
}

#[derive(Debug)]
pub enum NodeError {
    Corrupt(String),
}

pub struct InternalNodeKeyIterator<'a, 'b> {
    iter: Box<dyn Iterator<Item = fb::Edge<'a>> + 'b>,
}

impl<'b, 'a: 'b> InternalNodeKeyIterator<'a, 'b> {
    pub fn new(
        edges: flatbuffers::Vector<'a, flatbuffers::ForwardsUOffset<fb::Edge<'a>>>,
    ) -> InternalNodeKeyIterator<'a, 'b> {
        InternalNodeKeyIterator {
            iter: Box::new(edges.iter()),
        }
    }
}

impl<'a, 'b> Iterator for InternalNodeKeyIterator<'a, 'b> {
    type Item = &'a [u8];

    fn next(&mut self) -> Option<Self::Item> {
        // TODO validate Node on creation so this unwrap() is not dangerous.
        self.iter.next().map(|e| e.key().unwrap())
    }
}

pub struct DataNodeKeyIterator<'a, 'b> {
    iter: Box<dyn Iterator<Item = fb::DataNodeEntry<'a>> + 'b>,
}

impl<'b, 'a: 'b> DataNodeKeyIterator<'a, 'b> {
    pub fn new(
        entries: flatbuffers::Vector<'a, flatbuffers::ForwardsUOffset<fb::DataNodeEntry<'a>>>,
    ) -> DataNodeKeyIterator<'a, 'b> {
        DataNodeKeyIterator {
            iter: Box::new(entries.iter()),
        }
    }
}

impl<'a, 'b> Iterator for DataNodeKeyIterator<'a, 'b> {
    type Item = &'a [u8];

    fn next(&mut self) -> Option<Self::Item> {
        // TODO validate Node on creation so this unwrap() is not dangerous.
        self.iter.next().map(|dne| dne.key().unwrap())
    }
}

mod test_helpers {
    use super::*;
    use flatbuffers::FlatBufferBuilder;

    pub fn new_data_node(entries: &[(&str, &str)]) -> (Vec<u8>, usize) {
        let mut builder = FlatBufferBuilder::default();
        let fb_entries: Vec<flatbuffers::WIPOffset<fb::DataNodeEntry>> = entries
            .iter()
            .map(|e| {
                let key = builder.create_vector(e.0.as_bytes());
                let value = builder.create_vector(e.1.as_bytes());
                let mut dne = fb::DataNodeEntryBuilder::new(&mut builder);
                dne.add_key(key);
                dne.add_value(value);
                dne.finish()
            })
            .collect();
        let fb_entries_vec = builder.create_vector(fb_entries.as_slice());
        let mut dnb = fb::DataNodeBuilder::new(&mut builder);
        dnb.add_entries(fb_entries_vec);
        let fb_node = dnb.finish();
        let nra = fb::NodeRecordArgs {
            record_type: fb::Node::Data,
            record: Some(fb_node.as_union_value()),
        };
        let nr = fb::NodeRecord::create(&mut builder, &nra);
        builder.finish(nr, None);
        builder.collapse()
    }

    // A Leaf is also an Internal node, so both are created with this function, passing
    // the type as the first parameter.
    pub fn new_internal_node(node_type: fb::Node, edges: &[(&str, &str)]) -> (Vec<u8>, usize) {
        let mut builder = FlatBufferBuilder::default();
        let fb_edges: Vec<flatbuffers::WIPOffset<fb::Edge>> = edges
            .iter()
            .map(|e| {
                let key = builder.create_vector(e.0.as_bytes());
                let chunk_hash = builder.create_string(e.1);
                let mut eb = fb::EdgeBuilder::new(&mut builder);
                eb.add_key(key);
                eb.add_chunk_hash(chunk_hash);
                eb.finish()
            })
            .collect();
        let fb_edges_vec = builder.create_vector(fb_edges.as_slice());
        let mut inb = fb::InternalNodeBuilder::new(&mut builder);
        inb.add_edges(fb_edges_vec);
        let fb_node = inb.finish();
        let nra = fb::NodeRecordArgs {
            record_type: node_type,
            record: Some(fb_node.as_union_value()),
        };
        let nr = fb::NodeRecord::create(&mut builder, &nra);
        builder.finish(nr, None);
        builder.collapse()
    }
}

#[cfg(test)]
mod tests {
    use super::test_helpers::*;
    use super::*;

    #[async_std::test]
    async fn test_key_iter() {
        fn test(keys: &[&str]) {
            // Test Node::Data
            let entries: Vec<(&str, &str)> = keys.iter().map(|k| (*k, "")).collect();
            let (bytes, start) = new_data_node(&entries);
            let data_node =
                node_try_from_node_record(fb::get_root_as_node_record(&bytes[start..])).unwrap();
            let expected: Vec<&[u8]> = keys.iter().map(|k| k.as_bytes()).collect();
            let got: Vec<&[u8]> = data_node.key_iter().collect();
            assert_eq!(expected, got);

            // Test Node::Internal.
            let edges: Vec<(&str, &str)> = keys.iter().map(|k| (*k, "")).collect();
            let (bytes, start) = new_internal_node(fb::Node::Internal, &edges);
            let internal_node =
                node_try_from_node_record(fb::get_root_as_node_record(&bytes[start..])).unwrap();
            let got: Vec<&[u8]> = internal_node.key_iter().collect();
            assert_eq!(expected, got);

            // Test Node::Leaf.
            let (bytes, start) = new_internal_node(fb::Node::Leaf, &edges);
            let leaf_node =
                node_try_from_node_record(fb::get_root_as_node_record(&bytes[start..])).unwrap();
            let got: Vec<&[u8]> = leaf_node.key_iter().collect();
            assert_eq!(expected, got);
        }

        test(&[]);
        test(&[""]);
        test(&["a"]);
        test(&["a", "b", "c"]);
    }

    #[async_std::test]
    async fn test_find() {
        fn test(needle: &str, haystack: &[&str], expected: Result<usize, usize>) {
            let needle = needle.as_bytes();

            // Test Node::Data
            let entries: Vec<(&str, &str)> = haystack.iter().map(|k| (*k, "")).collect();
            let (bytes, start) = new_data_node(&entries);
            let data_node =
                node_try_from_node_record(fb::get_root_as_node_record(&bytes[start..])).unwrap();
            assert_eq!(expected, data_node.find(needle));

            // Test Node::Internal
            let edges: Vec<(&str, &str)> = haystack.iter().map(|k| (*k, "")).collect();
            let (bytes, start) = new_internal_node(fb::Node::Internal, &edges);
            let internal_node =
                node_try_from_node_record(fb::get_root_as_node_record(&bytes[start..])).unwrap();
            assert_eq!(expected, internal_node.find(needle));

            // Test Node::Leaf
            let (bytes, start) = new_internal_node(fb::Node::Leaf, &edges);
            let leaf_node =
                node_try_from_node_record(fb::get_root_as_node_record(&bytes[start..])).unwrap();
            assert_eq!(expected, leaf_node.find(needle));
        }

        test("", &[], Err(0));
        test("a", &[], Err(0));
        test("", &[""], Ok(0));

        test("a", &["a"], Ok(0));
        test("b", &["a"], Err(1));

        test("a", &["b", "d"], Err(0));
        test("b", &["b", "d"], Ok(0));
        test("c", &["b", "d"], Err(1));
        test("d", &["b", "d"], Ok(1));
        test("e", &["b", "d"], Err(2));
    }
}
